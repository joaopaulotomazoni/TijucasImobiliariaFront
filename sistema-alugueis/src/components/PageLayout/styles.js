import styled from 'styled-components';
import { Box, Paper } from '@mui/material';
import { fadeInUp } from '../../theme/animations';

export const PageContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: ${fadeInUp} 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
`;

export const PageTableContainer = styled(Paper)`
  && {
    width: 100%;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.04);
  }
`;
