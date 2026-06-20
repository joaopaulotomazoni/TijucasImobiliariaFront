import styled, { keyframes } from 'styled-components';
import { Box, Typography, Link as MuiLink } from '@mui/material';

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

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

export const Wrapper = styled(Box)`
  display: flex;
  min-height: 100vh;
`;

export const BrandPanel = styled(Box)`
  display: none;
  position: relative;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 64px;
  overflow: hidden;
  background: linear-gradient(
    160deg,
    ${({ theme }) => theme.palette.primary.dark} 0%,
    ${({ theme }) => theme.palette.primary.main} 100%
  );

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(
        circle at 15% 20%,
        rgba(255, 255, 255, 0.08) 0%,
        transparent 45%
      ),
      radial-gradient(
        circle at 85% 85%,
        ${({ theme }) => theme.palette.secondary.main}33 0%,
        transparent 40%
      );
  }

  @media (min-width: 900px) {
    display: flex;
  }
`;

export const BrandContent = styled(Box)`
  position: relative;
  z-index: 1;
  max-width: 420px;
  animation: ${fadeIn} 0.8s ease forwards;
`;

export const BrandLogoBadge = styled(Box)`
  display: inline-flex;
  margin-bottom: 10px;
  padding: 12px;
  border-radius: 28px;
  background: #ffffff;

  img {
    height: 140px;
    object-fit: contain;
    display: block;
  }
`;

export const BrandWordmark = styled(Typography)`
  && {
    color: #ffffff;
    font-weight: 700;
    line-height: 1.15;

    span {
      color: ${({ theme }) => theme.palette.secondary.light};
    }
  }
`;

export const BrandTagline = styled(Typography)`
  && {
    color: rgba(255, 255, 255, 0.75);
    margin-top: 16px;
    margin-bottom: 48px;
  }
`;

export const FeatureList = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const FeatureItem = styled(Box)`
  display: flex;
  align-items: center;
  gap: 16px;
  color: #ffffff;
`;

export const FeatureIconBadge = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
`;

export const FormPanel = styled(Box)`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: ${({ theme }) => theme.palette.background.default};
`;

export const FormContent = styled(Box)`
  width: 100%;
  max-width: 420px;
  animation: ${fadeInUp} 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
`;

export const Title = styled(Typography)`
  && {
    margin-bottom: 8px;
    font-weight: 700;
    color: ${({ theme }) => theme.palette.primary.dark};
    text-align: center;
  }
`;

export const Subtitle = styled(Typography)`
  && {
    margin-bottom: 32px;
    color: ${({ theme }) => theme.palette.text.secondary};
    text-align: center;
  }
`;

export const FormContainer = styled.form`
  width: 100%;
`;

export const StyledLink = styled(MuiLink)`
  && {
    color: ${({ theme }) => theme.palette.secondary.main};
    font-weight: 600;
    text-decoration: none;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: inherit;

    &:hover {
      color: ${({ theme }) => theme.palette.secondary.dark};
    }
  }
`;

export const StyledActionLink = styled(MuiLink)`
  && {
    color: ${({ theme }) => theme.palette.primary.main};
    font-weight: 700;
    text-decoration: none;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: inherit;

    &:hover {
      text-decoration: underline;
    }
  }
`;
