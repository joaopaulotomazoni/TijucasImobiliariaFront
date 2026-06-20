import styled, { keyframes } from 'styled-components';
import { Box, Paper, Typography } from '@mui/material';

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const Container = styled(Box)`
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffffff 0%, #f0f2eb 100%);
  padding: 16px;
`;

export const Card = styled(Paper)`
  && {
    padding: 48px;
    width: 100%;
    max-width: 440px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    animation: ${fadeInUp} 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
`;

export const IconBadge = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: rgba(68, 76, 42, 0.08);
  margin-bottom: 24px;

  svg {
    font-size: 2.75rem;
    color: ${({ theme }) => theme.palette.primary.dark};
  }
`;

export const Code = styled(Typography)`
  && {
    font-size: 4rem;
    font-weight: 800;
    line-height: 1;
    color: ${({ theme }) => theme.palette.primary.dark};
  }
`;

export const Title = styled(Typography)`
  && {
    margin-top: 8px;
    font-weight: 700;
    color: ${({ theme }) => theme.palette.primary.dark};
  }
`;

export const Subtitle = styled(Typography)`
  && {
    margin-top: 8px;
    margin-bottom: 32px;
    color: ${({ theme }) => theme.palette.text.secondary};
  }
`;
