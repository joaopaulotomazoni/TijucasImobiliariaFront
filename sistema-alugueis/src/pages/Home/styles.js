import styled from 'styled-components';
import { Box, Paper, Typography } from '@mui/material';

export const CardsContainer = styled(Box)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
`;

export const DashboardCard = styled(Paper)`
  && {
    padding: 24px;
    border-radius: 16px;
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-4px);
    }
  }
`;

export const CardHeader = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  svg {
    font-size: 2rem;
    color: ${({ theme, color }) => color || theme.palette.primary.main};
    opacity: 0.8;
  }
`;

export const CardTitle = styled(Typography)`
  && {
    font-size: 1rem;
    font-weight: 600;
    color: ${({ theme }) => theme.palette.text.secondary};
  }
`;

export const CardValue = styled(Typography)`
  && {
    font-size: 2rem;
    font-weight: 800;
    color: ${({ theme, color }) => color || theme.palette.text.primary};
  }
`;
