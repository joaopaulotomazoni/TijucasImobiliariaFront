import styled from 'styled-components';
import { Box } from '@mui/material';

const VARIANTS = {
  success: { bg: '#e8f5e9', color: '#2e7d32' },
  info: { bg: '#e3f2fd', color: '#1565c0' },
  warning: { bg: '#fff3e0', color: '#e65100' },
  error: { bg: '#ffebee', color: '#c62828' },
  neutral: { bg: '#f5f5f5', color: '#616161' },
};

const StatusChip = styled(Box).attrs({ component: 'span' })`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  background-color: ${({ variant }) =>
    (VARIANTS[variant] ?? VARIANTS.neutral).bg};
  color: ${({ variant }) => (VARIANTS[variant] ?? VARIANTS.neutral).color};
`;

export default StatusChip;
