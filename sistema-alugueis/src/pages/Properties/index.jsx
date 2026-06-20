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
  Autocomplete,
  createFilterOptions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import DomainDisabledOutlinedIcon from '@mui/icons-material/DomainDisabledOutlined';
import HomeIcon from '@mui/icons-material/Home';
import ApartmentIcon from '@mui/icons-material/Apartment';
import StoreIcon from '@mui/icons-material/Store';
import TerrainIcon from '@mui/icons-material/Terrain';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import CategoryIcon from '@mui/icons-material/Category';
import BedOutlinedIcon from '@mui/icons-material/BedOutlined';
import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined';
import DirectionsCarFilledOutlinedIcon from '@mui/icons-material/DirectionsCarFilledOutlined';
import { useModal } from '../../contexts/ModalContext';
import {
  PROPERTY_STATUS,
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUS_VARIANTS,
  PROPERTY_TYPE,
  PROPERTY_TYPE_LABELS,
  BRAZILIAN_STATES,
} from '../../constants/enums';
import PageHeader from '../../components/PageHeader';
import { ActionButton } from '../../components/PageHeader/styles';
import { PageContainer } from '../../components/PageLayout/styles';
import DataTable from '../../components/DataTable';
import StatusChip from '../../components/StatusChip';
import { useEffect } from 'react';
import {
  createProperty,
  getProperties,
  getOwners,
  updateProperty,
  deleteProperty,
} from '../../services/propertyService';
import { applyCepMask, applyDocumentMask } from '../../utils/masks';
import { getErrorMessage } from '../../utils/errors';
import { useCepLookup } from '../../hooks/useCepLookup';

const emptyAddress = {
  cep: '',
  estado: '',
  cidade: '',
  bairro: '',
  logradouro: '',
  numero: '',
  complemento: '',
};

const PROPERTY_TYPE_ICONS = {
  [PROPERTY_TYPE.CASA]: HomeIcon,
  [PROPERTY_TYPE.APARTAMENTO]: ApartmentIcon,
  [PROPERTY_TYPE.COMERCIAL]: StoreIcon,
  [PROPERTY_TYPE.TERRENO]: TerrainIcon,
  [PROPERTY_TYPE.GALPAO]: WarehouseIcon,
  [PROPERTY_TYPE.OUTRO]: CategoryIcon,
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(value)
  );

const mapOwnerFromApi = (owner) => ({
  id: owner.id,
  name: owner.nome_completo ?? '',
  document: applyDocumentMask(owner.documento ?? ''),
});

const mapAddressFromApi = (endereco) => {
  if (!endereco) return emptyAddress;
  return {
    id: endereco.id,
    cep: applyCepMask(endereco.cep ?? ''),
    estado: endereco.estado ?? '',
    cidade: endereco.cidade ?? '',
    bairro: endereco.bairro ?? '',
    logradouro: endereco.logradouro ?? '',
    numero: endereco.numero ?? '',
    complemento: endereco.complemento ?? '',
  };
};

const mapPropertyFromApi = (property) => ({
  id: property.id,
  tipoImovel: property.tipo_imovel ?? PROPERTY_TYPE.APARTAMENTO,
  ownerId: property.proprietario?.id ?? '',
  owner: property.proprietario ? mapOwnerFromApi(property.proprietario) : null,
  valorAluguelReferencia: property.valor_aluguel_referencia ?? '',
  valorCondominio: property.valor_condominio ?? '',
  valorIptu: property.valor_iptu ?? '',
  areaUtil: property.area_util ?? '',
  quartos: property.quartos ?? '',
  banheiros: property.banheiros ?? '',
  vagasGaragem: property.vagas_garagem ?? '',
  matricula: property.matricula ?? '',
  inscricaoIptu: property.inscricao_iptu ?? '',
  observacoes: property.observacoes ?? '',
  status: property.status ?? PROPERTY_STATUS.DISPONIVEL,
  address: mapAddressFromApi(property.endereco),
});

// Permite buscar tanto pelo nome quanto pelo CPF/CNPJ, digitado com ou sem máscara.
const filterOwners = createFilterOptions({
  stringify: (owner) =>
    `${owner.name} ${owner.document} ${owner.document.replace(/\D/g, '')}`,
});

const emptyProperty = {
  tipoImovel: PROPERTY_TYPE.APARTAMENTO,
  ownerId: '',
  valorAluguelReferencia: '',
  valorCondominio: '',
  valorIptu: '',
  areaUtil: '',
  quartos: '',
  banheiros: '',
  vagasGaragem: '',
  matricula: '',
  inscricaoIptu: '',
  observacoes: '',
  status: PROPERTY_STATUS.DISPONIVEL,
  address: emptyAddress,
};

export default function Properties() {
  const { showModal, showConfirm } = useModal();

  const [owners, setOwners] = useState([]);
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);

  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [open, setOpen] = useState(false);
  const [currentProperty, setCurrentProperty] = useState(null);
  const [formData, setFormData] = useState(emptyProperty);

  const { addressLockedByCep, lookupCep, unlockAddress } = useCepLookup({
    onAddressFound: (address) => {
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          logradouro: address.logradouro || prev.address.logradouro,
          bairro: address.bairro || prev.address.bairro,
          cidade: address.cidade || prev.address.cidade,
          estado: address.estado || prev.address.estado,
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

  const fetchOwners = async () => {
    setIsLoadingOwners(true);
    try {
      const response = await getOwners();
      setOwners(response.data.data.map(mapOwnerFromApi));
    } catch (error) {
      console.error('Erro ao buscar proprietários:', error);
      showModal({
        title: 'Erro',
        message: getErrorMessage(
          error,
          'Não foi possível carregar a lista de proprietários.'
        ),
        type: 'error',
      });
    } finally {
      setIsLoadingOwners(false);
    }
  };

  const handleOpen = (prop = null) => {
    if (prop) {
      setCurrentProperty(prop);
      setFormData({
        ...emptyProperty,
        ...prop,
        address: { ...emptyAddress, ...prop.address },
      });
    } else {
      setCurrentProperty(null);
      setFormData(emptyProperty);
    }
    unlockAddress();
    setOpen(true);
    fetchOwners();
  };

  const fetchProprietiesData = async () => {
    const response = await getProperties();
    setProperties(response.data.properties.map(mapPropertyFromApi));
  };

  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      address: { ...formData.address, [name]: value },
    });
  };

  const handleCepBlur = () => lookupCep(formData.address.cep);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (currentProperty) {
        await updateProperty(currentProperty.id, { propertiesData: formData });

        showModal({
          title: 'Sucesso',
          message: 'Imóvel atualizado com sucesso.',
          type: 'success',
        });
      } else {
        await createProperty({ propertiesData: formData });

        showModal({
          title: 'Sucesso',
          message: 'Imóvel cadastrado com sucesso.',
          type: 'success',
        });
      }
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar imóvel:', error);
      showModal({
        title: 'Erro',
        message: getErrorMessage(
          error,
          'Não foi possível salvar o imóvel. Tente novamente.'
        ),
        type: 'error',
      });
    } finally {
      await fetchProprietiesData();
      setIsSaving(false);
    }
  };

  const handleDelete = (id) => {
    showConfirm({
      title: 'Excluir imóvel',
      message:
        'Tem certeza que deseja excluir este imóvel? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      confirmColor: 'error',
      onConfirm: async () => {
        try {
          await deleteProperty(id);
          await fetchProprietiesData();
          showModal({
            title: 'Excluído',
            message: 'Imóvel removido.',
            type: 'info',
          });
        } catch (error) {
          console.error('Erro ao excluir imóvel:', error);
          showModal({
            title: 'Erro',
            message: getErrorMessage(
              error,
              'Não foi possível excluir o imóvel. Tente novamente.'
            ),
            type: 'error',
          });
        }
      },
    });
  };

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      try {
        await fetchProprietiesData();
      } catch (error) {
        console.error('Erro ao buscar imóveis:', error);
        showModal({
          title: 'Erro',
          message: getErrorMessage(
            error,
            'Não foi possível carregar os imóveis. Tente novamente.'
          ),
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProperties();
  }, []);

  return (
    <PageContainer>
      <PageHeader
        icon={<HomeWorkIcon />}
        title="Gestão de Imóveis"
        subtitle="Cadastre e acompanhe os imóveis da carteira."
        action={
          <ActionButton
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Novo Imóvel
          </ActionButton>
        }
      />

      <DataTable
        rows={properties}
        loading={isLoading}
        emptyIcon={<DomainDisabledOutlinedIcon />}
        emptyMessage="Nenhum imóvel cadastrado."
        columns={[
          {
            key: 'imovel',
            header: 'Imóvel',
            render: (row) => {
              const TypeIcon =
                PROPERTY_TYPE_ICONS[row.tipoImovel] ?? CategoryIcon;
              const owner = row.owner;
              return (
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
                    <TypeIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {PROPERTY_TYPE_LABELS[row.tipoImovel]}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      component="div"
                    >
                      {`${row.address.logradouro}, ${row.address.numero} - ${row.address.bairro}`}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      component="div"
                    >
                      {owner
                        ? `Propr.: ${owner.name}`
                        : 'Proprietário não informado'}
                    </Typography>
                  </Box>
                </Box>
              );
            },
            sortValue: (row) => PROPERTY_TYPE_LABELS[row.tipoImovel],
            searchValue: (row) =>
              [
                PROPERTY_TYPE_LABELS[row.tipoImovel],
                row.address.logradouro,
                row.address.numero,
                row.address.bairro,
                row.owner?.name,
                row.owner?.document,
              ]
                .filter(Boolean)
                .join(' '),
          },
          {
            key: 'city',
            header: 'Cidade/UF',
            render: (row) => `${row.address.cidade}/${row.address.estado}`,
            sortValue: (row) => row.address.cidade,
            searchValue: (row) => `${row.address.cidade} ${row.address.estado}`,
          },
          {
            key: 'details',
            header: 'Detalhes',
            render: (row) => (
              <Box sx={{ display: 'flex', gap: 1.5, color: 'text.secondary' }}>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                  title="Quartos"
                >
                  <BedOutlinedIcon fontSize="small" />
                  <Typography variant="body2">{row.quartos ?? '-'}</Typography>
                </Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                  title="Banheiros"
                >
                  <BathtubOutlinedIcon fontSize="small" />
                  <Typography variant="body2">
                    {row.banheiros ?? '-'}
                  </Typography>
                </Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                  title="Vagas de garagem"
                >
                  <DirectionsCarFilledOutlinedIcon fontSize="small" />
                  <Typography variant="body2">
                    {row.vagasGaragem ?? '-'}
                  </Typography>
                </Box>
              </Box>
            ),
          },
          {
            key: 'values',
            header: 'Valores',
            render: (row) => (
              <>
                <Typography variant="body2" fontWeight={600}>
                  {formatCurrency(row.valorAluguelReferencia)}
                </Typography>
                {(row.valorCondominio || row.valorIptu) && (
                  <Typography variant="caption" color="text.secondary">
                    {[
                      row.valorCondominio
                        ? `Cond. ${formatCurrency(row.valorCondominio)}`
                        : null,
                      row.valorIptu
                        ? `IPTU ${formatCurrency(row.valorIptu)}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Typography>
                )}
              </>
            ),
            sortValue: (row) => Number(row.valorAluguelReferencia),
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => (
              <StatusChip variant={PROPERTY_STATUS_VARIANTS[row.status]}>
                {PROPERTY_STATUS_LABELS[row.status]}
              </StatusChip>
            ),
            sortValue: (row) => PROPERTY_STATUS_LABELS[row.status],
            searchValue: (row) => PROPERTY_STATUS_LABELS[row.status],
          },
          {
            key: 'actions',
            header: 'Ações',
            align: 'right',
            render: (row) => (
              <>
                <IconButton color="primary" onClick={() => handleOpen(row)}>
                  <EditIcon />
                </IconButton>
                <IconButton color="error" onClick={() => handleDelete(row.id)}>
                  <DeleteIcon />
                </IconButton>
              </>
            ),
          },
        ]}
      />

      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          {currentProperty ? 'Editar Imóvel' : 'Novo Imóvel'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                select
                label="Tipo de Imóvel"
                name="tipoImovel"
                value={formData.tipoImovel}
                onChange={handleChange}
              >
                {Object.values(PROPERTY_TYPE).map((type) => (
                  <MenuItem key={type} value={type}>
                    {PROPERTY_TYPE_LABELS[type]}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={owners}
                loading={isLoadingOwners}
                loadingText="Carregando proprietários..."
                noOptionsText="Nenhum proprietário encontrado"
                filterOptions={filterOwners}
                value={owners.find((o) => o.id === formData.ownerId) ?? null}
                onChange={(_, owner) =>
                  setFormData({ ...formData, ownerId: owner?.id ?? '' })
                }
                isOptionEqualToValue={(option, value) =>
                  option.id === value?.id
                }
                getOptionLabel={(owner) =>
                  owner.document
                    ? `${owner.name} - ${owner.document}`
                    : owner.name
                }
                slotProps={{
                  listbox: { sx: { fontSize: '0.85rem' } },
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Proprietário"
                    placeholder="Busque por nome ou CPF/CNPJ"
                    helperText={
                      isLoadingOwners
                        ? 'Carregando proprietários...'
                        : undefined
                    }
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                {Object.values(PROPERTY_STATUS).map((status) => (
                  <MenuItem key={status} value={status}>
                    {PROPERTY_STATUS_LABELS[status]}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="Valor do Aluguel"
                type="number"
                name="valorAluguelReferencia"
                value={formData.valorAluguelReferencia}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="Condomínio (opcional)"
                type="number"
                name="valorCondominio"
                value={formData.valorCondominio ?? ''}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="IPTU (opcional)"
                type="number"
                name="valorIptu"
                value={formData.valorIptu ?? ''}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="Área Útil m² (opcional)"
                type="number"
                name="areaUtil"
                value={formData.areaUtil ?? ''}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Quartos"
                type="number"
                name="quartos"
                value={formData.quartos ?? ''}
                onChange={handleChange}
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Banheiros"
                type="number"
                name="banheiros"
                value={formData.banheiros ?? ''}
                onChange={handleChange}
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Vagas de Garagem"
                type="number"
                name="vagasGaragem"
                value={formData.vagasGaragem ?? ''}
                onChange={handleChange}
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Matrícula (opcional)"
                name="matricula"
                value={formData.matricula ?? ''}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Inscrição IPTU (opcional)"
                name="inscricaoIptu"
                value={formData.inscricaoIptu ?? ''}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Observações (opcional)"
                name="observacoes"
                value={formData.observacoes ?? ''}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider textAlign="left">
                <Typography variant="overline" color="text.secondary">
                  Endereço
                </Typography>
              </Divider>
            </Grid>

            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="CEP"
                name="cep"
                value={formData.address.cep}
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
                value={formData.address.estado}
                onChange={handleAddressChange}
                disabled={addressLockedByCep}
              >
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
                value={formData.address.cidade}
                onChange={handleAddressChange}
                disabled={addressLockedByCep}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Bairro"
                name="bairro"
                value={formData.address.bairro}
                onChange={handleAddressChange}
                disabled={addressLockedByCep}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Logradouro"
                name="logradouro"
                value={formData.address.logradouro}
                onChange={handleAddressChange}
                disabled={addressLockedByCep}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="Número"
                name="numero"
                value={formData.address.numero}
                onChange={handleAddressChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 9 }}>
              <TextField
                fullWidth
                label="Complemento (opcional)"
                name="complemento"
                value={formData.address.complemento}
                onChange={handleAddressChange}
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
    </PageContainer>
  );
}
