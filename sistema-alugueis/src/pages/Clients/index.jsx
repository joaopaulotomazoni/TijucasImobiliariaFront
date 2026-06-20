import { useState } from 'react';
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
  Switch,
  FormControlLabel,
  Chip,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import StarIcon from '@mui/icons-material/Star';
import { useModal } from '../../contexts/ModalContext';
import {
  BANK_ACCOUNT_TYPE,
  BANK_ACCOUNT_TYPE_LABELS,
  BRAZILIAN_STATES,
} from '../../constants/enums';
import {
  applyCepMask,
  applyPhoneMask,
  applyDocumentMask,
} from '../../utils/masks';
import { dateFieldSx } from '../../utils/formStyles';
import PageHeader from '../../components/PageHeader';
import { ActionButton } from '../../components/PageHeader/styles';
import { PageContainer } from '../../components/PageLayout/styles';
import DataTable from '../../components/DataTable';
import {
  createClient,
  deleteClient,
  getClients,
  updateClient,
} from '../../services/clientService';
import { useAuth } from '../../hooks/useAuth';
import { useCepLookup } from '../../hooks/useCepLookup';
import { getErrorMessage } from '../../utils/errors';
import { useEffect } from 'react';

const emptyAddress = {
  cep: '',
  estado: '',
  cidade: '',
  bairro: '',
  logradouro: '',
  numero: '',
  complemento: '',
};

const emptyBankAccount = {
  banco: '',
  agencia: '',
  conta: '',
  tipoConta: BANK_ACCOUNT_TYPE.CORRENTE,
  chavePix: '',
  principal: false,
};

const emptyClient = {
  nomeCompleto: '',
  documento: '',
  email: '',
  telefone: '',
  rg: '',
  dataNascimento: '',
  endereco: emptyAddress,
  contasBancarias: [],
};

const mapAddressFromApi = (endereco) => {
  const source = Array.isArray(endereco) ? endereco[0] : endereco;
  if (!source) return emptyAddress;
  return {
    id: source.id,
    cep: source.cep ?? '',
    estado: source.estado ?? '',
    cidade: source.cidade ?? '',
    bairro: source.bairro ?? '',
    logradouro: source.logradouro ?? '',
    numero: source.numero ?? '',
    complemento: source.complemento ?? '',
  };
};

const mapBankAccountFromApi = (bankAccount) => ({
  id: bankAccount.id,
  banco: bankAccount.banco ?? '',
  agencia: bankAccount.agencia ?? '',
  conta: bankAccount.conta ?? '',
  tipoConta: bankAccount.tipo_conta ?? BANK_ACCOUNT_TYPE.CORRENTE,
  chavePix: bankAccount.chave_pix ?? '',
  principal: bankAccount.principal ?? false,
});

const mapClientFromApi = (client) => ({
  id: client.id,
  nomeCompleto: client.nome_completo ?? '',
  documento: applyDocumentMask(client.documento ?? ''),
  email: client.email ?? '',
  telefone: applyPhoneMask(client.telefone ?? ''),
  rg: client.rg ?? '',
  dataNascimento: client.data_nascimento ?? '',
  endereco: mapAddressFromApi(client.endereco),
  contasBancarias: (client.contas_bancarias ?? []).map(mapBankAccountFromApi),
});

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [formData, setFormData] = useState(emptyClient);

  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [bankFormData, setBankFormData] = useState(emptyBankAccount);

  const { showModal, showConfirm } = useModal();
  const { user } = useAuth();

  const { addressLockedByCep, lookupCep, unlockAddress } = useCepLookup({
    onAddressFound: (address) => {
      setFormData((prev) => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          logradouro: address.logradouro || prev.endereco.logradouro,
          bairro: address.bairro || prev.endereco.bairro,
          cidade: address.cidade || prev.endereco.cidade,
          estado: address.estado || prev.endereco.estado,
        },
      }));
    },
    onNotFound: () =>
      showModal({
        title: 'CEP não encontrado',
        message: 'Verifique o CEP informado e preencha o endereço manualmente.',
        type: 'warning',
      }),
    onError: (error) => {
      console.error('Erro ao buscar CEP:', error);
      showModal({
        title: 'Erro',
        message: getErrorMessage(
          error,
          'Não foi possível buscar o endereço pelo CEP.'
        ),
        type: 'error',
      });
    },
  });

  const handleOpen = (client = null) => {
    if (client) {
      setCurrentClient(client);
      setFormData({
        ...emptyClient,
        ...client,
        endereco: { ...emptyAddress, ...client.endereco },
        contasBancarias: client.contasBancarias ?? [],
      });
    } else {
      setCurrentClient(null);
      setFormData(emptyClient);
    }
    unlockAddress();
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'telefone') {
      value = applyPhoneMask(value);
    } else if (name === 'documento') {
      value = applyDocumentMask(value);
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleAddressChange = (e) => {
    let { name, value } = e.target;
    if (name === 'cep') {
      value = applyCepMask(value);
      unlockAddress();
    }
    if (name === 'estado') {
      value = value.toUpperCase();
    }
    setFormData({
      ...formData,
      endereco: { ...formData.endereco, [name]: value },
    });
  };

  const handleCepBlur = () => lookupCep(formData.endereco.cep);

  const getClientsList = async () => {
    const response = await getClients();
    setClients(response.data.clients.map(mapClientFromApi));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (currentClient) {
        await updateClient(currentClient.id, {
          clientData: { ...formData },
        });

        await getClientsList();

        showModal({
          title: 'Sucesso',
          message: 'Cliente atualizado com sucesso.',
          type: 'success',
        });
      } else {
        await createClient({
          clientData: { ...formData },
        });

        await getClientsList();

        showModal({
          title: 'Sucesso',
          message: 'Cliente cadastrado com sucesso.',
          type: 'success',
        });
      }
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      showModal({
        title: 'Erro',
        message: getErrorMessage(
          error,
          'Não foi possível salvar o cliente. Tente novamente.'
        ),
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id) => {
    showConfirm({
      title: 'Excluir cliente',
      message:
        'Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      confirmColor: 'error',
      onConfirm: async () => {
        setDeletingId(id);
        try {
          await deleteClient(id);
          await getClientsList();
          showModal({
            title: 'Excluído',
            message: 'Cliente removido.',
            type: 'info',
          });
        } catch (error) {
          console.error('Erro ao excluir cliente:', error);
          showModal({
            title: 'Erro',
            message: getErrorMessage(
              error,
              'Não foi possível excluir o cliente. Tente novamente.'
            ),
            type: 'error',
          });
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const handleOpenBankDialog = () => {
    setBankFormData(emptyBankAccount);
    setBankDialogOpen(true);
  };

  const handleCloseBankDialog = () => setBankDialogOpen(false);

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setBankFormData({ ...bankFormData, [name]: value });
  };

  const handleSaveBankAccount = () => {
    const contasBancarias = bankFormData.principal
      ? formData.contasBancarias.map((c) => ({ ...c, principal: false }))
      : formData.contasBancarias;

    setFormData({
      ...formData,
      contasBancarias: [
        ...contasBancarias,
        { ...bankFormData, id: Date.now() },
      ],
    });
    handleCloseBankDialog();
  };

  const handleRemoveBankAccount = (id) => {
    setFormData({
      ...formData,
      contasBancarias: formData.contasBancarias.filter((c) => c.id !== id),
    });
  };

  useEffect(() => {
    async function fetchClientsData() {
      setIsLoadingClients(true);
      try {
        const response = await getClients();
        setClients(response.data.clients.map(mapClientFromApi));
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        showModal({
          title: 'Erro',
          message: getErrorMessage(
            error,
            'Não foi possível carregar os clientes. Tente novamente.'
          ),
          type: 'error',
        });
      } finally {
        setIsLoadingClients(false);
      }
    }

    fetchClientsData();
  }, [showModal, user.id]);

  return (
    <PageContainer>
      <PageHeader
        icon={<PeopleIcon />}
        title="Gestão de Clientes"
        subtitle="Cadastre e gerencie os clientes da imobiliária."
        action={
          <ActionButton
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Novo Cliente
          </ActionButton>
        }
      />

      <DataTable
        rows={clients}
        loading={isLoadingClients}
        emptyIcon={<PersonOffOutlinedIcon />}
        emptyMessage="Nenhum cliente cadastrado."
        columns={[
          {
            key: 'name',
            header: 'Cliente',
            render: (row) => (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    flexShrink: 0,
                    bgcolor: 'rgba(68, 76, 42, 0.08)',
                    color: 'primary.dark',
                  }}
                >
                  <PersonOutlineIcon fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {row.nomeCompleto}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.documento}
                  </Typography>
                </Box>
              </Box>
            ),
            sortValue: (row) => row.nomeCompleto,
            searchValue: (row) => `${row.nomeCompleto} ${row.documento}`,
          },
          {
            key: 'contact',
            header: 'Contato',
            render: (row) => (
              <Box>
                <Typography variant="body2">{row.email}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {row.telefone}
                </Typography>
              </Box>
            ),
            sortValue: (row) => row.email,
            searchValue: (row) => `${row.email} ${row.telefone}`,
          },
          {
            key: 'location',
            header: 'Correspondência',
            render: (row) => {
              const { cidade, estado } = row.endereco;
              if (!cidade && !estado) {
                return (
                  <Typography variant="body2" color="text.secondary">
                    Não informado
                  </Typography>
                );
              }
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOnOutlinedIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {[cidade, estado].filter(Boolean).join('/')}
                  </Typography>
                </Box>
              );
            },
            sortValue: (row) => row.endereco.cidade,
            searchValue: (row) =>
              `${row.endereco.cidade} ${row.endereco.estado} ${row.endereco.bairro}`,
          },
          {
            key: 'bankAccount',
            header: 'Conta Bancária',
            render: (row) => {
              const account =
                row.contasBancarias.find((c) => c.principal) ??
                row.contasBancarias[0];

              if (!account) {
                return (
                  <Typography variant="body2" color="text.secondary">
                    Nenhuma cadastrada
                  </Typography>
                );
              }

              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccountBalanceIcon fontSize="small" color="action" />
                  <Box>
                    <Typography variant="body2">{account.banco}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ag. {account.agencia} / Cc. {account.conta}
                    </Typography>
                  </Box>
                </Box>
              );
            },
            sortValue: (row) =>
              row.contasBancarias.find((c) => c.principal)?.banco ??
              row.contasBancarias[0]?.banco ??
              '',
            searchValue: (row) =>
              row.contasBancarias.map((c) => c.banco).join(' '),
          },
          {
            key: 'actions',
            header: 'Ações',
            align: 'right',
            render: (row) => (
              <>
                <IconButton
                  color="primary"
                  onClick={() => handleOpen(row)}
                  disabled={deletingId === row.id}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={() => handleDelete(row.id)}
                  disabled={deletingId === row.id}
                >
                  {deletingId === row.id ? (
                    <CircularProgress size={20} color="error" />
                  ) : (
                    <DeleteIcon />
                  )}
                </IconButton>
              </>
            ),
          },
        ]}
      />

      <Dialog
        open={open}
        onClose={isSaving ? undefined : handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {currentClient ? 'Editar Cliente' : 'Novo Cliente'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Nome Completo"
                name="nomeCompleto"
                value={formData.nomeCompleto}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Documento (CPF/CNPJ)"
                name="documento"
                value={formData.documento}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="RG (opcional)"
                name="rg"
                value={formData.rg}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Data de Nascimento (Opcional)"
                type="date"
                name="dataNascimento"
                value={formData.dataNascimento}
                onChange={handleChange}
                sx={dateFieldSx}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider textAlign="left">
                <Typography variant="overline" color="text.secondary">
                  Endereço de correspondência do cliente (opcional)
                </Typography>
              </Divider>
            </Grid>
            <Grid size={{ xs: 12 }}></Grid>

            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="CEP"
                name="cep"
                value={formData.endereco.cep}
                onChange={handleAddressChange}
                onBlur={handleCepBlur}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                select
                label="Estado"
                name="estado"
                value={formData.endereco.estado}
                onChange={handleAddressChange}
                disabled={addressLockedByCep}
              >
                <MenuItem value="">
                  <em>Nenhum</em>
                </MenuItem>
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
                name="cidade"
                value={formData.endereco.cidade}
                onChange={handleAddressChange}
                disabled={addressLockedByCep}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Bairro"
                name="bairro"
                value={formData.endereco.bairro}
                onChange={handleAddressChange}
                disabled={addressLockedByCep}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Logradouro"
                name="logradouro"
                value={formData.endereco.logradouro}
                onChange={handleAddressChange}
                disabled={addressLockedByCep}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="Número"
                name="numero"
                value={formData.endereco.numero}
                onChange={handleAddressChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 9 }}>
              <TextField
                fullWidth
                label="Complemento (opcional)"
                name="complemento"
                value={formData.endereco.complemento}
                onChange={handleAddressChange}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider textAlign="left">
                <Typography variant="overline" color="text.secondary">
                  Contas Bancárias
                </Typography>
              </Divider>
            </Grid>

            <Grid size={{ xs: 12 }}>
              {formData.contasBancarias.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma conta bancária adicionada.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {formData.contasBancarias.map((account) => (
                    <Box
                      key={account.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        borderRadius: '8px',
                        px: 2,
                        py: 1,
                      }}
                    >
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <AccountBalanceIcon fontSize="small" color="action" />
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {account.banco} — Ag. {account.agencia} / Cc.{' '}
                            {account.conta}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {BANK_ACCOUNT_TYPE_LABELS[account.tipoConta]}
                            {account.chavePix
                              ? ` · PIX: ${account.chavePix}`
                              : ''}
                          </Typography>
                        </Box>
                        {account.principal && (
                          <Chip
                            size="small"
                            icon={<StarIcon fontSize="small" />}
                            label="Principal"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveBankAccount(account.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Button startIcon={<AddIcon />} onClick={handleOpenBankDialog}>
                Adicionar Conta Bancária
              </Button>
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

      <Dialog
        open={bankDialogOpen}
        onClose={handleCloseBankDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nova Conta Bancária</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Banco"
                name="banco"
                value={bankFormData.banco}
                onChange={handleBankChange}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Agência"
                name="agencia"
                value={bankFormData.agencia}
                onChange={handleBankChange}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Conta"
                name="conta"
                value={bankFormData.conta}
                onChange={handleBankChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Tipo de Conta"
                name="tipoConta"
                value={bankFormData.tipoConta}
                onChange={handleBankChange}
              >
                {Object.values(BANK_ACCOUNT_TYPE).map((type) => (
                  <MenuItem key={type} value={type}>
                    {BANK_ACCOUNT_TYPE_LABELS[type]}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Chave PIX (opcional)"
                name="chavePix"
                value={bankFormData.chavePix}
                onChange={handleBankChange}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={bankFormData.principal}
                    onChange={(e) =>
                      setBankFormData({
                        ...bankFormData,
                        principal: e.target.checked,
                      })
                    }
                  />
                }
                label="Definir como conta principal"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBankDialog} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleSaveBankAccount}
            variant="contained"
            color="primary"
          >
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
