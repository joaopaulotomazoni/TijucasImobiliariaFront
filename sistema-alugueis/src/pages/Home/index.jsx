import { useAuth } from '../../hooks/useAuth';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PageHeader from '../../components/PageHeader';
import { PageContainer } from '../../components/PageLayout/styles';

import {
  CardsContainer,
  DashboardCard,
  CardHeader,
  CardTitle,
  CardValue,
} from './styles';

export default function Home() {
  const { user } = useAuth();

  const metrics = {
    totalProperties: 12,
    rentedProperties: 8,
    availableProperties: 4,
    overdueLeases: 1,
    receivedThisMonth: 12500,
    pendingThisMonth: 1500,
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <PageContainer>
      <PageHeader
        icon={<DashboardIcon />}
        title="Dashboard"
        subtitle={`Bem-vindo de volta, ${user?.name || 'Corretor'}. Aqui está o resumo da sua carteira.`}
      />

      <CardsContainer>
        <DashboardCard elevation={0}>
          <CardHeader>
            <CardTitle>Imóveis Disponíveis</CardTitle>
            <CheckCircleOutlinedIcon color="success" />
          </CardHeader>
          <CardValue>{metrics.availableProperties}</CardValue>
        </DashboardCard>

        <DashboardCard elevation={0}>
          <CardHeader>
            <CardTitle>Imóveis Alugados</CardTitle>
            <HomeWorkIcon color="primary" />
          </CardHeader>
          <CardValue>{metrics.rentedProperties}</CardValue>
        </DashboardCard>

        <DashboardCard elevation={0}>
          <CardHeader>
            <CardTitle>Total de Imóveis</CardTitle>
            <HomeWorkIcon color="disabled" />
          </CardHeader>
          <CardValue>{metrics.totalProperties}</CardValue>
        </DashboardCard>
      </CardsContainer>

      <CardsContainer sx={{ mt: 2 }}>
        <DashboardCard elevation={0}>
          <CardHeader>
            <CardTitle>Recebido este Mês</CardTitle>
            <AttachMoneyIcon color="success" />
          </CardHeader>
          <CardValue color="#2e7d32">
            {formatCurrency(metrics.receivedThisMonth)}
          </CardValue>
        </DashboardCard>

        <DashboardCard elevation={0}>
          <CardHeader>
            <CardTitle>Pendente este Mês</CardTitle>
            <WarningAmberIcon color="warning" />
          </CardHeader>
          <CardValue color="#ed6c02">
            {formatCurrency(metrics.pendingThisMonth)}
          </CardValue>
        </DashboardCard>

        <DashboardCard elevation={0}>
          <CardHeader>
            <CardTitle>Aluguéis Vencidos</CardTitle>
            <ErrorOutlinedIcon color="error" />
          </CardHeader>
          <CardValue color="#d32f2f">{metrics.overdueLeases}</CardValue>
        </DashboardCard>
      </CardsContainer>
    </PageContainer>
  );
}
