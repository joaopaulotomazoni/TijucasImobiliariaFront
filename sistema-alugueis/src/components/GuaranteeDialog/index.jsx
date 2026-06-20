import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Divider,
  Typography,
  Box,
  Autocomplete,
  Switch,
  FormControlLabel,
  IconButton,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import {
  GUARANTEE_TYPE,
  GUARANTEE_TYPE_LABELS,
  GUARANTEE_STATUS,
  GUARANTEE_STATUS_LABELS,
  GUARANTEE_STATUS_VARIANTS,
  CAUCAO_MODALITY,
  CAUCAO_MODALITY_LABELS,
  MARITAL_STATUS,
  MARITAL_STATUS_LABELS,
  PROPERTY_REGIME,
  PROPERTY_REGIME_LABELS,
  INSURANCE_STATUS,
  INSURANCE_STATUS_LABELS,
  PREMIUM_PERIODICITY,
  PREMIUM_PERIODICITY_LABELS,
  UPLOAD_DOC_TYPE,
  BRAZILIAN_STATES,
} from '../../constants/enums';
import { dateFieldSx } from '../../utils/formStyles';
import { applyDocumentMask, applyCepMask } from '../../utils/masks';
import { getErrorMessage } from '../../utils/errors';
import StatusChip from '../StatusChip';
import FileUpload from '../FileUpload';
import {
  getGuarantees,
  createGuarantee,
  substituteGuarantee,
  registerCaucaoDevolucao,
  exonerateFiador,
} from '../../services/guaranteeService';

const firstOf = (value) => (Array.isArray(value) ? value[0] : value);

const formatCurrency = (value) =>
  value == null || value === ''
    ? '—'
    : new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(Number(value));

const formatDate = (iso) => {
  if (!iso) return '—';
  const [year, month, day] = String(iso).slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
};

const emptyGuaranteeAddress = () => ({
  cep: '',
  estado: '',
  cidade: '',
  bairro: '',
  logradouro: '',
  numero: '',
  complemento: '',
});

const emptyFiador = () => ({
  usuarioId: '',
  rendaComprovada: '',
  comprovanteRendaKey: '',
  estadoCivil: '',
  regimeBens: '',
  conjugeNome: '',
  conjugeDocumento: '',
  outorgaConjugal: false,
  imovelGarantiaMatricula: '',
  imovelGarantiaQuitado: false,
  imovelGarantiaEndereco: emptyGuaranteeAddress(),
});

const buildEmptyForm = (rentValue) => ({
  tipo: GUARANTEE_TYPE.CAUCAO,
  // caução (só dinheiro, por ora)
  modalidade: CAUCAO_MODALITY.DINHEIRO,
  valor: rentValue ? String(3 * Number(rentValue)) : '',
  banco: '',
  agencia: '',
  contaPoupanca: '',
  dataDeposito: '',
  // fiador
  fiadores: [emptyFiador()],
  // seguro
  seguradora: '',
  numeroApolice: '',
  vigenciaInicio: '',
  vigenciaFim: '',
  valorCobertura: '',
  valorPremio: '',
  periodicidadePremio: PREMIUM_PERIODICITY.MENSAL,
  statusAprovacao: INSURANCE_STATUS.PENDENTE,
  apoliceKey: '',
});

// Remove chaves com string vazia (enums opcionais não aceitam '' no backend).
const pruneEmpty = (obj) => {
  const out = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== '' && val !== undefined && val !== null) out[key] = val;
  }
  return out;
};

export default function GuaranteeDialog({
  open,
  onClose,
  contract,
  clients,
  onError,
  onSuccess,
}) {
  const rentValue = contract?.valorAluguel;

  const [guarantees, setGuarantees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 'view' mostra a garantia ativa; 'form' cria/substitui.
  const [mode, setMode] = useState('view');
  const [isSubstitute, setIsSubstitute] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [formData, setFormData] = useState(buildEmptyForm(rentValue));

  // sub-ações
  const [devolucao, setDevolucao] = useState(null);
  const [exoneracao, setExoneracao] = useState(null);

  // Endereços do imóvel de garantia bloqueados após autofill por CEP,
  // indexados pela posição do fiador no array (igual à key da lista).
  const [fiadorAddressLocked, setFiadorAddressLocked] = useState({});

  const activeGuarantee = guarantees.find(
    (g) => g.status === GUARANTEE_STATUS.ATIVA
  );
  const history = guarantees.filter((g) => g.status !== GUARANTEE_STATUS.ATIVA);

  const loadGuarantees = useCallback(async () => {
    if (!contract) return;
    setIsLoading(true);
    try {
      const response = await getGuarantees(contract.id);
      const data = response.data.data ?? [];
      setGuarantees(data);
      const active = data.find((g) => g.status === GUARANTEE_STATUS.ATIVA);
      setMode(active ? 'view' : 'form');
    } catch (error) {
      console.error('Erro ao carregar garantias:', error);
      onError?.(
        getErrorMessage(error, 'Não foi possível carregar as garantias.')
      );
    } finally {
      setIsLoading(false);
    }
  }, [contract, onError]);

  // O reset de estado ao abrir é feito por remontagem (prop `key` no pai),
  // então aqui o efeito só sincroniza com a API ao abrir o diálogo.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) loadGuarantees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleField = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // Ao trocar o tipo, repõe o valor sugerido da caução.
  const handleTipoChange = (e) => {
    const tipo = e.target.value;
    setFormData((prev) => ({
      ...prev,
      tipo,
      valor:
        tipo === GUARANTEE_TYPE.CAUCAO && rentValue
          ? String(3 * Number(rentValue))
          : prev.valor,
    }));
  };

  const handleFiadorField = (index, field, value) => {
    setFormData((prev) => {
      const fiadores = [...prev.fiadores];
      fiadores[index] = { ...fiadores[index], [field]: value };
      return { ...prev, fiadores };
    });
  };

  const handleFiadorAddress = (index, field, value) => {
    setFormData((prev) => {
      const fiadores = [...prev.fiadores];
      fiadores[index] = {
        ...fiadores[index],
        imovelGarantiaEndereco: {
          ...fiadores[index].imovelGarantiaEndereco,
          [field]: value,
        },
      };
      return { ...prev, fiadores };
    });
    if (field === 'cep') {
      setFiadorAddressLocked((prev) => {
        if (!prev[index]) return prev;
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const handleFiadorCepBlur = async (index) => {
    const cep = formData.fiadores[index]?.imovelGarantiaEndereco?.cep;
    const cleanCep = (cep ?? '').replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    try {
      const response = await axios.get(
        `https://viacep.com.br/ws/${cleanCep}/json/`
      );

      if (response.data.erro) {
        onError?.(
          'CEP não encontrado. Verifique o CEP informado e preencha o endereço manualmente.'
        );
        return;
      }

      setFormData((prev) => {
        const fiadores = [...prev.fiadores];
        const current = fiadores[index].imovelGarantiaEndereco;
        fiadores[index] = {
          ...fiadores[index],
          imovelGarantiaEndereco: {
            ...current,
            logradouro: response.data.logradouro || current.logradouro,
            bairro: response.data.bairro || current.bairro,
            cidade: response.data.localidade || current.cidade,
            estado: response.data.uf || current.estado,
          },
        };
        return { ...prev, fiadores };
      });
      setFiadorAddressLocked((prev) => ({ ...prev, [index]: true }));
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      onError?.(
        getErrorMessage(error, 'Não foi possível buscar o endereço pelo CEP.')
      );
    }
  };

  const addFiador = () => {
    setFormData((prev) => ({
      ...prev,
      fiadores: [...prev.fiadores, emptyFiador()],
    }));
    setFiadorAddressLocked({});
  };

  const removeFiador = (index) => {
    setFormData((prev) => ({
      ...prev,
      fiadores: prev.fiadores.filter((_, i) => i !== index),
    }));
    setFiadorAddressLocked({});
  };

  const buildPayload = () => {
    const { tipo } = formData;

    if (tipo === GUARANTEE_TYPE.CAUCAO) {
      return pruneEmpty({
        tipo,
        modalidade: CAUCAO_MODALITY.DINHEIRO,
        valor: formData.valor,
        banco: formData.banco,
        agencia: formData.agencia,
        contaPoupanca: formData.contaPoupanca,
        dataDeposito: formData.dataDeposito,
      });
    }

    if (tipo === GUARANTEE_TYPE.FIADOR) {
      return {
        tipo,
        fiadores: formData.fiadores.map((f) => {
          const fiador = pruneEmpty({
            usuarioId: f.usuarioId,
            rendaComprovada: f.rendaComprovada,
            comprovanteRendaKey: f.comprovanteRendaKey,
            estadoCivil: f.estadoCivil,
            regimeBens: f.regimeBens,
            conjugeNome: f.conjugeNome,
            conjugeDocumento: f.conjugeDocumento,
            outorgaConjugal: f.outorgaConjugal,
            imovelGarantiaMatricula: f.imovelGarantiaMatricula,
            imovelGarantiaQuitado: f.imovelGarantiaQuitado,
          });
          // Só envia o endereço do imóvel de garantia se o CEP foi preenchido.
          if (f.imovelGarantiaEndereco?.cep) {
            fiador.imovelGarantiaEndereco = f.imovelGarantiaEndereco;
          }
          return fiador;
        }),
      };
    }

    // SEGURO_FIANCA
    return pruneEmpty({
      tipo,
      seguradora: formData.seguradora,
      numeroApolice: formData.numeroApolice,
      vigenciaInicio: formData.vigenciaInicio,
      vigenciaFim: formData.vigenciaFim,
      valorCobertura: formData.valorCobertura,
      valorPremio: formData.valorPremio,
      periodicidadePremio: formData.periodicidadePremio,
      statusAprovacao: formData.statusAprovacao,
      apoliceKey: formData.apoliceKey,
    });
  };

  const validate = () => {
    const { tipo } = formData;
    if (tipo === GUARANTEE_TYPE.CAUCAO) {
      if (!formData.valor) return 'Informe o valor da caução em dinheiro.';
    }
    if (tipo === GUARANTEE_TYPE.FIADOR) {
      if (formData.fiadores.some((f) => !f.usuarioId))
        return 'Selecione o cliente de cada fiador.';
    }
    if (tipo === GUARANTEE_TYPE.SEGURO_FIANCA) {
      if (
        !formData.seguradora ||
        !formData.numeroApolice ||
        !formData.vigenciaInicio ||
        !formData.vigenciaFim ||
        !formData.valorCobertura
      )
        return 'Preencha seguradora, apólice, vigência e valor de cobertura.';
    }
    if (isSubstitute && !motivo.trim())
      return 'Informe o motivo da substituição.';
    return null;
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      onError?.(error);
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildPayload();
      if (isSubstitute && activeGuarantee) {
        await substituteGuarantee(activeGuarantee.id, motivo, payload);
        onSuccess?.('Garantia substituída com sucesso.');
      } else {
        await createGuarantee(contract.id, payload);
        onSuccess?.('Garantia registrada com sucesso.');
      }
      setIsSubstitute(false);
      setMotivo('');
      await loadGuarantees();
    } catch (err) {
      console.error('Erro ao salvar garantia:', err);
      onError?.(getErrorMessage(err, 'Não foi possível salvar a garantia.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDevolucao = async () => {
    setIsSaving(true);
    try {
      await registerCaucaoDevolucao(activeGuarantee.id, {
        valorDevolvido: devolucao.valorDevolvido || undefined,
        valorRetido: devolucao.valorRetido || undefined,
        motivoRetencao: devolucao.motivoRetencao || undefined,
        dataDevolucao: devolucao.dataDevolucao,
      });
      onSuccess?.('Devolução da caução registrada.');
      setDevolucao(null);
      await loadGuarantees();
    } catch (err) {
      console.error('Erro na devolução:', err);
      onError?.(
        getErrorMessage(err, 'Não foi possível registrar a devolução.')
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleExonerar = async () => {
    setIsSaving(true);
    try {
      await exonerateFiador(activeGuarantee.id, exoneracao.usuarioId, {
        dataNotificacao: exoneracao.dataNotificacao,
      });
      onSuccess?.('Fiador exonerado.');
      setExoneracao(null);
      await loadGuarantees();
    } catch (err) {
      console.error('Erro ao exonerar:', err);
      onError?.(getErrorMessage(err, 'Não foi possível exonerar o fiador.'));
    } finally {
      setIsSaving(false);
    }
  };

  const startSubstitute = () => {
    setFormData(buildEmptyForm(rentValue));
    setIsSubstitute(true);
    setMode('form');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Garantia do Contrato</DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress size={28} />
          </Box>
        ) : mode === 'view' && activeGuarantee ? (
          <ActiveGuaranteeView
            guarantee={activeGuarantee}
            history={history}
            clients={clients}
            onSubstitute={startSubstitute}
            onDevolucao={() =>
              setDevolucao({
                valorDevolvido: '',
                valorRetido: '',
                motivoRetencao: '',
                dataDevolucao: '',
              })
            }
            onExonerar={(usuarioId) =>
              setExoneracao({ usuarioId, dataNotificacao: '' })
            }
          />
        ) : (
          <GuaranteeForm
            formData={formData}
            clients={clients}
            rentValue={rentValue}
            isSubstitute={isSubstitute}
            motivo={motivo}
            setMotivo={setMotivo}
            onField={handleField}
            onTipoChange={handleTipoChange}
            onFiadorField={handleFiadorField}
            onFiadorAddress={handleFiadorAddress}
            onFiadorCepBlur={handleFiadorCepBlur}
            fiadorAddressLocked={fiadorAddressLocked}
            onAddFiador={addFiador}
            onRemoveFiador={removeFiador}
            onError={onError}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={isSaving}>
          Fechar
        </Button>
        {mode === 'form' && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            loading={isSaving}
          >
            {isSubstitute ? 'Substituir' : 'Registrar garantia'}
          </Button>
        )}
      </DialogActions>

      {/* Devolução de caução */}
      <Dialog
        open={Boolean(devolucao)}
        onClose={() => setDevolucao(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Registrar devolução da caução</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Valor devolvido"
                type="number"
                value={devolucao?.valorDevolvido ?? ''}
                onChange={(e) =>
                  setDevolucao((p) => ({
                    ...p,
                    valorDevolvido: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Valor retido"
                type="number"
                value={devolucao?.valorRetido ?? ''}
                onChange={(e) =>
                  setDevolucao((p) => ({ ...p, valorRetido: e.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Motivo da retenção"
                value={devolucao?.motivoRetencao ?? ''}
                onChange={(e) =>
                  setDevolucao((p) => ({
                    ...p,
                    motivoRetencao: e.target.value,
                  }))
                }
                helperText="Obrigatório se houver valor retido"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Data da devolução"
                type="date"
                value={devolucao?.dataDevolucao ?? ''}
                onChange={(e) =>
                  setDevolucao((p) => ({ ...p, dataDevolucao: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
                sx={dateFieldSx}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDevolucao(null)} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleDevolucao}
            variant="contained"
            loading={isSaving}
            disabled={!devolucao?.dataDevolucao}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Exoneração de fiador */}
      <Dialog
        open={Boolean(exoneracao)}
        onClose={() => setExoneracao(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Exonerar fiador</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            O fiador segue responsável por 120 dias após a notificação (Lei
            8.245/91, art. 40, X).
          </Typography>
          <TextField
            fullWidth
            label="Data da notificação"
            type="date"
            value={exoneracao?.dataNotificacao ?? ''}
            onChange={(e) =>
              setExoneracao((p) => ({ ...p, dataNotificacao: e.target.value }))
            }
            InputLabelProps={{ shrink: true }}
            sx={dateFieldSx}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExoneracao(null)} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleExonerar}
            variant="contained"
            color="warning"
            loading={isSaving}
            disabled={!exoneracao?.dataNotificacao}
          >
            Exonerar
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}

// ===================== Visualização da garantia ativa =====================

function ActiveGuaranteeView({
  guarantee,
  history,
  clients,
  onSubstitute,
  onDevolucao,
  onExonerar,
}) {
  const caucao = firstOf(guarantee.caucao);
  const seguro = firstOf(guarantee.seguro);
  const fiadores = guarantee.fiadores ?? [];
  const clientName = (id) =>
    clients.find((c) => c.id === id)?.name ??
    fiadores.find((f) => f.usuario_id === id)?.usuario?.nome_completo ??
    `Cliente ${id}`;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <StatusChip variant={GUARANTEE_STATUS_VARIANTS[guarantee.status]}>
          {GUARANTEE_STATUS_LABELS[guarantee.status]}
        </StatusChip>
        <Typography variant="h6">
          {GUARANTEE_TYPE_LABELS[guarantee.tipo]}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          size="small"
          startIcon={<SwapHorizIcon />}
          onClick={onSubstitute}
        >
          Substituir
        </Button>
      </Box>

      {guarantee.tipo === GUARANTEE_TYPE.CAUCAO && caucao && (
        <Grid container spacing={1.5}>
          <Info
            label="Modalidade"
            value={CAUCAO_MODALITY_LABELS[caucao.modalidade]}
          />
          <Info label="Valor" value={formatCurrency(caucao.valor)} />
          <Info label="Banco" value={caucao.banco || '—'} />
          <Info label="Conta poupança" value={caucao.conta_poupanca || '—'} />
          <Info label="Depósito" value={formatDate(caucao.data_deposito)} />
          {caucao.data_devolucao && (
            <>
              <Grid size={{ xs: 12 }}>
                <Divider />
              </Grid>
              <Info
                label="Devolvido"
                value={formatCurrency(caucao.valor_devolvido)}
              />
              <Info
                label="Retido"
                value={formatCurrency(caucao.valor_retido)}
              />
              <Info
                label="Data devolução"
                value={formatDate(caucao.data_devolucao)}
              />
            </>
          )}
          {!caucao.data_devolucao && (
            <Grid size={{ xs: 12 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={onDevolucao}
                sx={{ mt: 1 }}
              >
                Registrar devolução
              </Button>
            </Grid>
          )}
        </Grid>
      )}

      {guarantee.tipo === GUARANTEE_TYPE.SEGURO_FIANCA && seguro && (
        <Grid container spacing={1.5}>
          <Info label="Seguradora" value={seguro.seguradora} />
          <Info label="Apólice" value={seguro.numero_apolice} />
          <Info
            label="Vigência"
            value={`${formatDate(seguro.vigencia_inicio)} a ${formatDate(seguro.vigencia_fim)}`}
          />
          <Info
            label="Cobertura"
            value={formatCurrency(seguro.valor_cobertura)}
          />
          <Info label="Prêmio" value={formatCurrency(seguro.valor_premio)} />
          <Info
            label="Situação"
            value={INSURANCE_STATUS_LABELS[seguro.status_aprovacao]}
          />
        </Grid>
      )}

      {guarantee.tipo === GUARANTEE_TYPE.FIADOR && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {fiadores.map((f) => (
            <Box
              key={f.usuario_id}
              sx={{
                p: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ flexGrow: 1 }}
                >
                  {f.usuario?.nome_completo ?? clientName(f.usuario_id)}
                </Typography>
                <StatusChip
                  variant={f.status === 'EXONERADO' ? 'error' : 'success'}
                >
                  {f.status === 'EXONERADO' ? 'Exonerado' : 'Ativo'}
                </StatusChip>
                {f.status !== 'EXONERADO' && (
                  <Button
                    size="small"
                    color="warning"
                    onClick={() => onExonerar(f.usuario_id)}
                  >
                    Exonerar
                  </Button>
                )}
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                component="div"
              >
                Renda: {formatCurrency(f.renda_comprovada)}
                {f.imovel_garantia_matricula
                  ? ` · Imóvel matr. ${f.imovel_garantia_matricula}`
                  : ''}
                {f.data_fim_responsabilidade
                  ? ` · Responsável até ${formatDate(f.data_fim_responsabilidade)}`
                  : ''}
              </Typography>
              {firstOf(f.imovel_garantia_endereco) && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  component="div"
                >
                  {(() => {
                    const end = firstOf(f.imovel_garantia_endereco);
                    return `Imóvel de garantia: ${end.logradouro}, ${end.numero ?? 's/n'} - ${end.cidade}/${end.estado}`;
                  })()}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}

      {history.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Divider textAlign="left" sx={{ mb: 1 }}>
            <Typography variant="overline" color="text.secondary">
              Histórico
            </Typography>
          </Divider>
          {history.map((g) => (
            <Box
              key={g.id}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}
            >
              <StatusChip variant={GUARANTEE_STATUS_VARIANTS[g.status]}>
                {GUARANTEE_STATUS_LABELS[g.status]}
              </StatusChip>
              <Typography variant="body2">
                {GUARANTEE_TYPE_LABELS[g.tipo]}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDate(g.data_inicio)} — {formatDate(g.data_fim)}
                {g.motivo_substituicao ? ` · ${g.motivo_substituicao}` : ''}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

function Info({ label, value }) {
  return (
    <Grid size={{ xs: 6, sm: 4 }}>
      <Typography variant="caption" color="text.secondary" component="div">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Grid>
  );
}

// ===================== Formulário de criação/substituição =====================

function GuaranteeForm({
  formData,
  clients,
  rentValue,
  isSubstitute,
  motivo,
  setMotivo,
  onField,
  onTipoChange,
  onFiadorField,
  onFiadorAddress,
  onFiadorCepBlur,
  fiadorAddressLocked,
  onAddFiador,
  onRemoveFiador,
  onError,
}) {
  return (
    <Grid container spacing={2}>
      {isSubstitute && (
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Motivo da substituição"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            helperText="Ex.: exoneração do fiador, mudança para seguro fiança"
          />
        </Grid>
      )}

      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          fullWidth
          select
          label="Tipo de garantia"
          name="tipo"
          value={formData.tipo}
          onChange={onTipoChange}
        >
          {Object.values(GUARANTEE_TYPE).map((tipo) => (
            <MenuItem key={tipo} value={tipo}>
              {GUARANTEE_TYPE_LABELS[tipo]}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Divider />
      </Grid>

      {/* ---- CAUÇÃO (só em dinheiro, por ora) ---- */}
      {formData.tipo === GUARANTEE_TYPE.CAUCAO && (
        <>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Valor"
              type="number"
              name="valor"
              value={formData.valor}
              onChange={onField}
              helperText={
                rentValue
                  ? `Sugerido: 3× o aluguel. Máx. legal ${formatCurrency(3 * Number(rentValue))}`
                  : 'Máximo legal: 3 aluguéis'
              }
              slotProps={{ htmlInput: { min: 0 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Banco"
              name="banco"
              value={formData.banco}
              onChange={onField}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Agência"
              name="agencia"
              value={formData.agencia}
              onChange={onField}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Conta poupança"
              name="contaPoupanca"
              value={formData.contaPoupanca}
              onChange={onField}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Data do depósito"
              type="date"
              name="dataDeposito"
              value={formData.dataDeposito}
              onChange={onField}
              InputLabelProps={{ shrink: true }}
              sx={dateFieldSx}
            />
          </Grid>
        </>
      )}

      {/* ---- FIADOR ---- */}
      {formData.tipo === GUARANTEE_TYPE.FIADOR && (
        <>
          {formData.fiadores.map((fiador, index) => (
            <Grid size={{ xs: 12 }} key={index}>
              <Box
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                    Fiador {index + 1}
                  </Typography>
                  {formData.fiadores.length > 1 && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onRemoveFiador(index)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      options={clients}
                      getOptionLabel={(c) =>
                        c.document ? `${c.name} - ${c.document}` : c.name
                      }
                      value={
                        clients.find((c) => c.id === fiador.usuarioId) ?? null
                      }
                      onChange={(_, c) =>
                        onFiadorField(index, 'usuarioId', c?.id ?? '')
                      }
                      isOptionEqualToValue={(o, v) => o.id === v?.id}
                      slotProps={{ listbox: { sx: { fontSize: '0.85rem' } } }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Cliente (fiador)"
                          placeholder="Busque por nome ou CPF/CNPJ"
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      label="Renda comprovada"
                      type="number"
                      value={fiador.rendaComprovada}
                      onChange={(e) =>
                        onFiadorField(index, 'rendaComprovada', e.target.value)
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <FileUpload
                      label="Comprovante de renda"
                      tipo={UPLOAD_DOC_TYPE.COMPROVANTE_RENDA}
                      value={fiador.comprovanteRendaKey}
                      onChange={(key) =>
                        onFiadorField(index, 'comprovanteRendaKey', key)
                      }
                      onError={onError}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      select
                      label="Estado civil"
                      value={fiador.estadoCivil}
                      onChange={(e) =>
                        onFiadorField(index, 'estadoCivil', e.target.value)
                      }
                    >
                      <MenuItem value="">Não informado</MenuItem>
                      {Object.values(MARITAL_STATUS).map((s) => (
                        <MenuItem key={s} value={s}>
                          {MARITAL_STATUS_LABELS[s]}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  {fiador.estadoCivil === MARITAL_STATUS.CASADO && (
                    <>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          select
                          label="Regime de bens"
                          value={fiador.regimeBens}
                          onChange={(e) =>
                            onFiadorField(index, 'regimeBens', e.target.value)
                          }
                        >
                          <MenuItem value="">Não informado</MenuItem>
                          {Object.values(PROPERTY_REGIME).map((r) => (
                            <MenuItem key={r} value={r}>
                              {PROPERTY_REGIME_LABELS[r]}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={fiador.outorgaConjugal}
                              onChange={(e) =>
                                onFiadorField(
                                  index,
                                  'outorgaConjugal',
                                  e.target.checked
                                )
                              }
                            />
                          }
                          label="Outorga conjugal"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Nome do cônjuge"
                          value={fiador.conjugeNome}
                          onChange={(e) =>
                            onFiadorField(index, 'conjugeNome', e.target.value)
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Documento do cônjuge"
                          value={fiador.conjugeDocumento}
                          onChange={(e) =>
                            onFiadorField(
                              index,
                              'conjugeDocumento',
                              applyDocumentMask(e.target.value)
                            )
                          }
                        />
                      </Grid>
                    </>
                  )}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Matrícula do imóvel de garantia"
                      value={fiador.imovelGarantiaMatricula}
                      onChange={(e) =>
                        onFiadorField(
                          index,
                          'imovelGarantiaMatricula',
                          e.target.value
                        )
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={fiador.imovelGarantiaQuitado}
                          onChange={(e) =>
                            onFiadorField(
                              index,
                              'imovelGarantiaQuitado',
                              e.target.checked
                            )
                          }
                        />
                      }
                      label="Imóvel de garantia quitado"
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      Endereço do imóvel de garantia (opcional)
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      label="CEP"
                      value={fiador.imovelGarantiaEndereco.cep}
                      onChange={(e) =>
                        onFiadorAddress(
                          index,
                          'cep',
                          applyCepMask(e.target.value)
                        )
                      }
                      onBlur={() => onFiadorCepBlur(index)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      select
                      label="Estado"
                      value={fiador.imovelGarantiaEndereco.estado}
                      onChange={(e) =>
                        onFiadorAddress(index, 'estado', e.target.value)
                      }
                      disabled={Boolean(fiadorAddressLocked[index])}
                    >
                      <MenuItem value="">—</MenuItem>
                      {BRAZILIAN_STATES.map((uf) => (
                        <MenuItem key={uf} value={uf}>
                          {uf}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Cidade"
                      value={fiador.imovelGarantiaEndereco.cidade}
                      onChange={(e) =>
                        onFiadorAddress(index, 'cidade', e.target.value)
                      }
                      disabled={Boolean(fiadorAddressLocked[index])}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Bairro"
                      value={fiador.imovelGarantiaEndereco.bairro}
                      onChange={(e) =>
                        onFiadorAddress(index, 'bairro', e.target.value)
                      }
                      disabled={Boolean(fiadorAddressLocked[index])}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Logradouro"
                      value={fiador.imovelGarantiaEndereco.logradouro}
                      onChange={(e) =>
                        onFiadorAddress(index, 'logradouro', e.target.value)
                      }
                      disabled={Boolean(fiadorAddressLocked[index])}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField
                      fullWidth
                      label="Número"
                      value={fiador.imovelGarantiaEndereco.numero}
                      onChange={(e) =>
                        onFiadorAddress(index, 'numero', e.target.value)
                      }
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          ))}
          <Grid size={{ xs: 12 }}>
            <Button size="small" startIcon={<AddIcon />} onClick={onAddFiador}>
              Adicionar fiador
            </Button>
          </Grid>
        </>
      )}

      {/* ---- SEGURO FIANÇA ---- */}
      {formData.tipo === GUARANTEE_TYPE.SEGURO_FIANCA && (
        <>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              fullWidth
              label="Seguradora"
              name="seguradora"
              value={formData.seguradora}
              onChange={onField}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Número da apólice"
              name="numeroApolice"
              value={formData.numeroApolice}
              onChange={onField}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth
              label="Vigência início"
              type="date"
              name="vigenciaInicio"
              value={formData.vigenciaInicio}
              onChange={onField}
              InputLabelProps={{ shrink: true }}
              sx={dateFieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth
              label="Vigência fim"
              type="date"
              name="vigenciaFim"
              value={formData.vigenciaFim}
              onChange={onField}
              InputLabelProps={{ shrink: true }}
              sx={dateFieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth
              label="Valor de cobertura"
              type="number"
              name="valorCobertura"
              value={formData.valorCobertura}
              onChange={onField}
              slotProps={{ htmlInput: { min: 0 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth
              label="Prêmio"
              type="number"
              name="valorPremio"
              value={formData.valorPremio}
              onChange={onField}
              slotProps={{ htmlInput: { min: 0 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              select
              label="Periodicidade do prêmio"
              name="periodicidadePremio"
              value={formData.periodicidadePremio}
              onChange={onField}
            >
              {Object.values(PREMIUM_PERIODICITY).map((p) => (
                <MenuItem key={p} value={p}>
                  {PREMIUM_PERIODICITY_LABELS[p]}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              select
              label="Situação da aprovação"
              name="statusAprovacao"
              value={formData.statusAprovacao}
              onChange={onField}
            >
              {Object.values(INSURANCE_STATUS).map((s) => (
                <MenuItem key={s} value={s}>
                  {INSURANCE_STATUS_LABELS[s]}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FileUpload
              label="Apólice (PDF)"
              tipo={UPLOAD_DOC_TYPE.APOLICE_SEGURO}
              value={formData.apoliceKey}
              onChange={(key) =>
                onField({ target: { name: 'apoliceKey', value: key } })
              }
              onError={onError}
            />
          </Grid>
        </>
      )}
    </Grid>
  );
}
