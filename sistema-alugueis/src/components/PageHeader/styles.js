import styled from 'styled-components';
import { Box, Typography, Button } from '@mui/material';

export const HeaderRow = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
`;

export const TitleGroup = styled(Box)`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const IconBadge = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(68, 76, 42, 0.08);

  svg {
    font-size: 1.75rem;
    color: ${({ theme }) => theme.palette.primary.dark};
  }
`;

export const Title = styled(Typography)`
  && {
    font-size: 2rem;
    font-weight: 700;
    color: ${({ theme }) => theme.palette.primary.dark};
    line-height: 1.2;
  }
`;

export const Subtitle = styled(Typography)`
  && {
    color: ${({ theme }) => theme.palette.text.secondary};
    margin-top: 4px;
  }
`;

export const ActionButton = styled(Button)`
  && {
    border-radius: 8px;
    font-weight: 600;
    text-transform: none;
  }
`;
