import { useState, useEffect } from 'react';
import {
  IconButton,
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
  createFilterOptions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import PlaylistRemoveOutlinedIcon from '@mui/icons-material/PlaylistRemoveOutlined';
import { useModal } from '../../contexts/ModalContext';
import { useAuth } from '../../hooks/useAuth';
import {
  LEASE_STATUS,
  LEASE_STATUS_LABELS,
  LEASE_STATUS_VARIANTS,
  REAJUSTE_INDEX,
  REAJUSTE_INDEX_LABELS,
  PROPERTY_STATUS,
  PROPERTY_TYPE_LABELS,
} from '../../constants/enums';
import PageHeader from '../../components/PageHeader';
import { ActionButton } from '../../components/PageHeader/styles';
import { PageContainer } from '../../components/PageLayout/styles';
import DataTable from '../../components/DataTable';
import StatusChip from '../../components/StatusChip';
import GuaranteeDialog from '../../components/GuaranteeDialog';
import { dateFieldSx } from '../../utils/formStyles';
import { applyDocumentMask } from '../../utils/masks';
import { getErrorMessage } from '../../utils/errors';
import {
  getContracts,
  createContract,
  updateContract,
  deleteContract,
} from '../../services/leaseService';
import { getProperties } from '../../services/propertyService';
import { getClients } from '../../services/clientService';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(value)
  );

const formatDate = (iso) => {
  if (!iso) return '-';
  const [year, month, day] = String(iso).slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
};

const propertyAddressLabel = (property) => {
  const e = property.endereco;
  if (!e) return PROPERTY_TYPE_LABELS[property.tipo_imovel] ?? 'Imóvel';
  return `${PROPERTY_TYPE_LABELS[property.tipo_imovel] ?? 'Imóvel'} — ${e.logradouro}, ${e.numero} (${e.cidade}/${e.estado})`;
};

const mapPropertyOption = (property) => ({
  id: property.id,
  status: property.status,
  label: propertyAddressLabel(property),
});

const mapClientOption = (client) => ({
  id: client.id,
  name: client.nome_completo ?? '',
  document: applyDocumentMask(client.documento ?? ''),
});

const mapContractFromApi = (contract) => {
  const tenants = (contract.inquilinos ?? []).map((item) => ({
    id: item.usuario?.id,
    name: item.usuario?.nome_completo ?? '',
    document: applyDocumentMask(item.usuario?.documento ?? ''),
    principal: item.principal ?? false,
  }));
  const principal = tenants.find((t) => t.principal) ?? tenants[0] ?? null;

  return {
    id: contract.id,
    imovelId: contract.imovel?.id ?? contract.imovel_id ?? '',
    imovel: contract.imovel ?? null,
    dataInicio: contract.data_inicio ?? '',
    dataFim: contract.data_fim ?? '',
    valorAluguel: contract.valor_aluguel ?? '',
    diaVencimento: contract.dia_vencimento ?? '',
    indiceReajuste: contract.indice_reajuste ?? REAJUSTE_INDEX.IGPM,
    periodicidadeReajusteMeses: contract.periodicidade_reajuste_meses ?? '',
    percentualMultaAtraso: contract.percentual_multa_atraso ?? '',
    percentualJurosMoraMensal: contract.percentual_juros_mora_mensal ?? '',
    diasTolerancia: contract.dias_tolerancia ?? '',
    taxaAdministracaoPercentual: contract.taxa_administracao_percentual ?? '',
    dataDevolucaoImovel: contract.data_devolucao_imovel ?? '',
    status: contract.status ?? LEASE_STATUS.ATIVO,
    observacoes: contract.observacoes ?? '',
    tenants,
    principalTenantName: principal?.name ?? '',
    tenantIds: tenants.map((t) => t.id),
    principalTenantId: principal?.id ?? '',
  };
};

const filterClients = createFilterOptions({
  stringify: (client) =>
    `${client.name} ${client.document} ${client.document.replace(/\D/g, '')}`,
});

const emptyContract = {
  imovelId: '',
  dataInicio: '',
  dataFim: '',
  valorAluguel: '',
  diaVencimento: '',
  indiceReajuste: REAJUSTE_INDEX.IGPM,
  periodicidadeReajusteMeses: '12',
  percentualMultaAtraso: '2',
  percentualJurosMoraMensal: '1',
  diasTolerancia: '0',
  taxaAdministracaoPercentual: '0',
  dataDevolucaoImovel: '',
  status: LEASE_STATUS.ATIVO,
  observacoes: '',
  tenantIds: [],
  principalTenantId: '',
};

export default function Leases() {
  const { showModal, showConfirm } = useModal();
  const { user } = useAuth();

  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoadingRefs, setIsLoadingRefs] = useState(false);

  const [open, setOpen] = useState(false);
  const [currentContract, setCurrentContract] = useState(null);
  const [formData, setFormData] = useState(emptyContract);

  const [guaranteeContract, setGuaranteeContract] = useState(null);

  const isEditing = Boolean(currentContract);

  const fetchContracts = async () => {
    const response = await getContracts();
    setContracts(response.data.data.map(mapContractFromApi));
  };

  const fetchRefs = async () => {
    setIsLoadingRefs(true);
    try {
      const [propsRes, clientsRes] = await Promise.all([
        getProperties(),
        getClients(),
      ]);
      setProperties(propsRes.data.properties.map(mapPropertyOption));
      setClients(clientsRes.data.clients.map(mapClientOption));
    } catch (error) {
      console.error('Erro ao carregar imóveis/clientes:', error);
      showModal({
        title: 'Erro',
        message: getErrorMessage(
          error,
          'Não foi possível carregar imóveis e clientes.'
        ),
        type: 'error',
      });
    } finally {
      setIsLoadingRefs(false);
    }
  };

  const handleOpen = (contract = null) => {
    if (contract) {
      setCurrentContract(contract);
      setFormData({ ...emptyContract, ...contract });
    } else {
      setCurrentContract(null);
      setFormData(emptyContract);
    }
    setOpen(true);
    fetchRefs();
  };

  const handleClose = () => setOpen(false);

  const handleOpenGuarantee = (contract) => {
    setGuaranteeContract(contract);
    fetchRefs(); // garante a lista de clientes para seleção de fiadores
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTenantsChange = (_, selected) => {
    const tenantIds = selected.map((c) => c.id);
    setFormData((prev) => ({
      ...prev,
      tenantIds,
      // mantém o principal se ainda estiver na lista, senão cai no primeiro.
      principalTenantId: tenantIds.includes(prev.principalTenantId)
        ? prev.principalTenantId
        : (tenantIds[0] ?? ''),
    }));
  };

  const buildPayload = () => {
    const inquilinos = formData.tenantIds.map((usuarioId) => ({
      usuarioId,
      principal: usuarioId === formData.principalTenantId,
    }));

    const contractData = {
      imovelId: formData.imovelId,
      corretorId: user?.id,
      dataInicio: formData.dataInicio,
      dataFim: formData.dataFim,
      valorAluguel: formData.valorAluguel,
      diaVencimento: formData.diaVencimento,
      indiceReajuste: formData.indiceReajuste,
      periodicidadeReajusteMeses: formData.periodicidadeReajusteMeses,
      percentualMultaAtraso: formData.percentualMultaAtraso,
      percentualJurosMoraMensal: formData.percentualJurosMoraMensal,
      diasTolerancia: formData.diasTolerancia,
      taxaAdministracaoPercentual: formData.taxaAdministracaoPercentual,
      observacoes: formData.observacoes,
      inquilinos,
    };

    if (isEditing) {
      contractData.status = formData.status;
      contractData.dataDevolucaoImovel = formData.dataDevolucaoImovel || '';
    }

    return { contractData };
  };

  const validateForm = () => {
    if (!formData.imovelId) return 'Selecione o imóvel do contrato.';
    if (formData.tenantIds.length === 0)
      return 'Selecione ao menos um inquilino.';
    if (!formData.dataInicio || !formData.dataFim)
      return 'Informe as datas de início e fim.';
    if (formData.dataFim <= formData.dataInicio)
      return 'A data de fim deve ser posterior à data de início.';
    if (!formData.valorAluguel) return 'Informe o valor do aluguel.';
    if (!formData.diaVencimento) return 'Informe o dia de vencimento.';
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      showModal({ title: 'Atenção', message: validationError, type: 'warning' });
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing) {
        await updateContract(currentContract.id, buildPayload());
        showModal({
          title: 'Sucesso',
          message: 'Contrato atualizado com sucesso.',
          type: 'success',
        });
      } else {
        await createContract(buildPayload());
        showModal({
          title: 'Sucesso',
          message: 'Contrato criado com sucesso.',
          type: 'success',
        });
      }
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar contrato:', error);
      showModal({
        title: 'Erro',
        message: getErrorMessage(
          error,
          'Não foi possível salvar o contrato. Tente novamente.'
        ),
        type: 'error',
      });
    } finally {
      await fetchContracts();
      setIsSaving(false);
    }
  };

  const handleDelete = (id) => {
    showConfirm({
      title: 'Excluir contrato',
      message:
        'Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      confirmColor: 'error',
      onConfirm: async () => {
        try {
          await deleteContract(id);
          await fetchContracts();
          showModal({
            title: 'Excluído',
            message: 'Contrato removido.',
            type: 'info',
          });
        } catch (error) {
          console.error('Erro ao excluir contrato:', error);
          showModal({
            title: 'Erro',
            message: getErrorMessage(
              error,
              'Não foi possível excluir o contrato. Tente novamente.'
            ),
            type: 'error',
          });
        }
      },
    });
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        await fetchContracts();
      } catch (error) {
        console.error('Erro ao buscar contratos:', error);
        showModal({
          title: 'Erro',
          message: getErrorMessage(
            error,
            'Não foi possível carregar os contratos. Tente novamente.'
          ),
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // No cadastro, só imóveis disponíveis. Na edição, o imóvel é fixo.
  const availableProperties = properties.filter(
    (p) => p.status === PROPERTY_STATUS.DISPONIVEL
  );
  const selectedTenants = clients.filter((c) =>
    formData.tenantIds.includes(c.id)
  );

  return (
    <PageContainer>
      <PageHeader
        icon={<DescriptionIcon />}
        title="Gestão de Contratos"
        subtitle="Acompanhe os contratos de locação ativos e encerrados."
        action={
          <ActionButton
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Novo Contrato
          </ActionButton>
        }
      />

      <DataTable
        rows={contracts}
        loading={isLoading}
        emptyIcon={<PlaylistRemoveOutlinedIcon />}
        emptyMessage="Nenhum contrato cadastrado."
        columns={[
          {
            key: 'property',
            header: 'Imóvel',
            render: (row) => {
              const e = row.imovel?.endereco;
              return (
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {PROPERTY_TYPE_LABELS[row.imovel?.tipo_imovel] ?? 'Imóvel'}
                  </Typography>
                  {e && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      component="div"
                    >
                      {`${e.logradouro}, ${e.numero} - ${e.cidade}/${e.estado}`}
                    </Typography>
                  )}
                </Box>
              );
            },
            sortValue: (row) => row.imovel?.endereco?.logradouro ?? '',
            searchValue: (row) =>
              [
                PROPERTY_TYPE_LABELS[row.imovel?.tipo_imovel],
                row.imovel?.endereco?.logradouro,
                row.imovel?.endereco?.cidade,
              ]
                .filter(Boolean)
                .join(' '),
          },
          {
            key: 'tenants',
            header: 'Inquilino(s)',
            render: (row) => {
              const extra = row.tenants.length - 1;
              return (
                <Box>
                  <Typography variant="body2">
                    {row.principalTenantName || '—'}
                  </Typography>
                  {extra > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {`+ ${extra} inquilino${extra > 1 ? 's' : ''}`}
                    </Typography>
                  )}
                </Box>
              );
            },
            sortValue: (row) => row.principalTenantName,
            searchValue: (row) => row.tenants.map((t) => t.name).join(' '),
          },
          {
            key: 'period',
            header: 'Vigência',
            render: (row) =>
              `${formatDate(row.dataInicio)} até ${formatDate(row.dataFim)}`,
            sortValue: (row) => row.dataInicio,
          },
          {
            key: 'value',
            header: 'Valor (R$)',
            render: (row) => formatCurrency(row.valorAluguel),
            sortValue: (row) => Number(row.valorAluguel),
          },
          {
            key: 'dueDay',
            header: 'Vencimento',
            render: (row) => `Dia ${row.diaVencimento}`,
            sortValue: (row) => Number(row.diaVencimento),
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => (
              <StatusChip variant={LEASE_STATUS_VARIANTS[row.status]}>
                {LEASE_STATUS_LABELS[row.status]}
              </StatusChip>
            ),
            sortValue: (row) => LEASE_STATUS_LABELS[row.status],
            searchValue: (row) => LEASE_STATUS_LABELS[row.status],
          },
          {
            key: 'actions',
            header: 'Ações',
            align: 'right',
            render: (row) => (
              <>
                <IconButton
                  color="primary"
                  onClick={() => handleOpenGuarantee(row)}
                  title="Garantia"
                >
                  <GppGoodOutlinedIcon />
                </IconButton>
                <IconButton color="primary" onClick={() => handleOpen(row)} title="Editar">
                  <EditIcon />
                </IconButton>
                <IconButton color="error" onClick={() => handleDelete(row.id)} title="Excluir">
                  <DeleteIcon />
                </IconButton>
              </>
            ),
          },
        ]}
      />

      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          {isEditing ? 'Editar Contrato' : 'Novo Contrato'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Imóvel e inquilinos */}
            <Grid size={{ xs: 12, sm: 6 }}>
              {isEditing ? (
                <TextField
                  fullWidth
                  label="Imóvel"
                  value={
                    currentContract?.imovel
                      ? propertyAddressLabel(currentContract.imovel)
                      : 'Imóvel do contrato'
                  }
                  disabled
                  helperText="O imóvel não pode ser alterado após a criação."
                />
              ) : (
                <Autocomplete
                  options={availableProperties}
                  loading={isLoadingRefs}
                  loadingText="Carregando imóveis..."
                  noOptionsText="Nenhum imóvel disponível"
                  getOptionLabel={(option) => option.label}
                  value={
                    availableProperties.find(
                      (p) => p.id === formData.imovelId
                    ) ?? null
                  }
                  onChange={(_, option) =>
                    setFormData({ ...formData, imovelId: option?.id ?? '' })
                  }
                  isOptionEqualToValue={(option, value) =>
                    option.id === value?.id
                  }
                  slotProps={{ listbox: { sx: { fontSize: '0.85rem' } } }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Imóvel"
                      placeholder="Selecione um imóvel disponível"
                    />
                  )}
                />
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                multiple
                options={clients}
                loading={isLoadingRefs}
                loadingText="Carregando clientes..."
                noOptionsText="Nenhum cliente encontrado"
                filterOptions={filterClients}
                value={selectedTenants}
                onChange={handleTenantsChange}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                getOptionLabel={(client) =>
                  client.document
                    ? `${client.name} - ${client.document}`
                    : client.name
                }
                slotProps={{ listbox: { sx: { fontSize: '0.85rem' } } }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Inquilinos"
                    placeholder="Busque por nome ou CPF/CNPJ"
                  />
                )}
              />
            </Grid>

            {formData.tenantIds.length > 1 && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Inquilino principal"
                  name="principalTenantId"
                  value={formData.principalTenantId}
                  onChange={handleChange}
                >
                  {selectedTenants.map((tenant) => (
                    <MenuItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <Divider textAlign="left">
                <Typography variant="overline" color="text.secondary">
                  Vigência e valores
                </Typography>
              </Divider>
            </Grid>

            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="Data de Início"
                type="date"
                name="dataInicio"
                value={formData.dataInicio}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                sx={dateFieldSx}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="Data de Fim"
                type="date"
                name="dataFim"
                value={formData.dataFim}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                sx={dateFieldSx}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="Valor do Aluguel"
                type="number"
                name="valorAluguel"
                value={formData.valorAluguel}
                onChange={handleChange}
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="Dia do Vencimento"
                type="number"
                name="diaVencimento"
                value={formData.diaVencimento}
                onChange={handleChange}
                helperText="Entre 1 e 28"
                slotProps={{ htmlInput: { min: 1, max: 28 } }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider textAlign="left">
                <Typography variant="overline" color="text.secondary">
                  Reajuste e encargos
                </Typography>
              </Divider>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                select
                label="Índice de Reajuste"
                name="indiceReajuste"
                value={formData.indiceReajuste}
                onChange={handleChange}
              >
                {Object.values(REAJUSTE_INDEX).map((index) => (
                  <MenuItem key={index} value={index}>
                    {REAJUSTE_INDEX_LABELS[index]}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Periodicidade do Reajuste"
                type="number"
                name="periodicidadeReajusteMeses"
                value={formData.periodicidadeReajusteMeses}
                onChange={handleChange}
                helperText="Em meses (mínimo 12, por lei)"
                slotProps={{ htmlInput: { min: 12 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Taxa de Administração (%)"
                type="number"
                name="taxaAdministracaoPercentual"
                value={formData.taxaAdministracaoPercentual}
                onChange={handleChange}
                slotProps={{ htmlInput: { min: 0, max: 100 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Multa por Atraso (%)"
                type="number"
                name="percentualMultaAtraso"
                value={formData.percentualMultaAtraso}
                onChange={handleChange}
                slotProps={{ htmlInput: { min: 0, max: 100 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Juros de Mora Mensal (%)"
                type="number"
                name="percentualJurosMoraMensal"
                value={formData.percentualJurosMoraMensal}
                onChange={handleChange}
                slotProps={{ htmlInput: { min: 0, max: 100 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Dias de Tolerância"
                type="number"
                name="diasTolerancia"
                value={formData.diasTolerancia}
                onChange={handleChange}
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Grid>

            {isEditing && (
              <>
                <Grid size={{ xs: 12 }}>
                  <Divider textAlign="left">
                    <Typography variant="overline" color="text.secondary">
                      Situação
                    </Typography>
                  </Divider>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    select
                    label="Status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    {Object.values(LEASE_STATUS).map((status) => (
                      <MenuItem key={status} value={status}>
                        {LEASE_STATUS_LABELS[status]}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Data de Devolução do Imóvel"
                    type="date"
                    name="dataDevolucaoImovel"
                    value={formData.dataDevolucaoImovel}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    sx={dateFieldSx}
                    helperText="Preencha quando o imóvel for devolvido"
                  />
                </Grid>
              </>
            )}

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Observações (opcional)"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                multiline
                minRows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit" disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            loading={isSaving}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <GuaranteeDialog
        key={guaranteeContract?.id ?? 'closed'}
        open={Boolean(guaranteeContract)}
        contract={guaranteeContract}
        clients={clients}
        onClose={() => setGuaranteeContract(null)}
        onError={(message) =>
          showModal({ title: 'Atenção', message, type: 'warning' })
        }
        onSuccess={(message) =>
          showModal({ title: 'Sucesso', message, type: 'success' })
        }
      />
    </PageContainer>
  );
}
