import styled, { keyframes } from 'styled-components';
import {
  Box,
  Drawer as MuiDrawer,
  AppBar as MuiAppBar,
  Typography,
} from '@mui/material';
import { NavLink } from 'react-router-dom';

const drawerWidth = 264;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const Root = styled(Box)`
  display: flex;
  min-height: 100vh;
  background: ${({ theme }) => theme.palette.background.default};
`;

export const AppBar = styled(MuiAppBar)`
  && {
    width: calc(100% - ${drawerWidth}px);
    margin-left: ${drawerWidth}px;
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(14px);
    color: ${({ theme }) => theme.palette.text.primary};
  }
`;

export const Drawer = styled(MuiDrawer)`
  && {
    width: ${drawerWidth}px;
    flex-shrink: 0;

    & .MuiDrawer-paper {
      width: ${drawerWidth}px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      border-right: none;
      color: ${({ theme }) => theme.palette.primary.contrastText};
      background: linear-gradient(
        160deg,
        ${({ theme }) => theme.palette.primary.dark} 0%,
        ${({ theme }) => theme.palette.primary.main} 100%
      );
      overflow: hidden;
    }

    & .MuiDrawer-paper::before {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        radial-gradient(
          circle at 15% 12%,
          rgba(255, 255, 255, 0.1) 0%,
          transparent 42%
        ),
        radial-gradient(
          circle at 90% 90%,
          ${({ theme }) => theme.palette.secondary.main}30 0%,
          transparent 45%
        );
    }
  }
`;

export const DrawerHeader = styled(Box)`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 32px 20px 24px;
`;

export const BrandLogoBadge = styled(Box)`
  display: inline-flex;
  padding: 8px;
  border-radius: 24px;

  img {
    height: 92px;
    object-fit: contain;
    display: block;
    filter: brightness(0) invert(1);
  }
`;

export const BrandWordmark = styled(Typography)`
  && {
    color: #ffffff;
    font-weight: 700;
    font-size: 1.15rem;
    letter-spacing: 0.2px;
    text-align: center;

    span {
      color: ${({ theme }) => theme.palette.secondary.light};
    }
  }
`;

export const NavSectionLabel = styled(Typography)`
  && {
    position: relative;
    z-index: 1;
    padding: 0 20px;
    margin-bottom: 8px;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.45);
  }
`;

export const NavList = styled(Box)`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
  gap: 6px;
`;

export const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.72);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.25s ease;

  svg {
    margin-right: 14px;
    font-size: 1.2rem;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    transform: translateX(4px);
  }

  &.active {
    background: ${({ theme }) => theme.palette.secondary.main};
    color: ${({ theme }) => theme.palette.secondary.contrastText};
    font-weight: 600;
  }
`;

export const DrawerFooter = styled(Box)`
  position: relative;
  z-index: 1;
  margin-top: auto;
  padding: 16px;
`;

export const UserCard = styled(Box)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.16);
  }

  .user-meta {
    min-width: 0;
  }

  .user-name {
    font-weight: 600;
    font-size: 0.9rem;
    color: #ffffff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-role {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
  }
`;

export const UserAvatar = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.palette.primary.dark};
  background: #ffffff;
`;

export const MainContent = styled(Box)`
  flex-grow: 1;
  padding: 32px;
  margin-top: 64px;
  overflow-x: hidden;
  animation: ${fadeIn} 0.4s ease forwards;
`;

export const UserInfo = styled(Box)`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
`;
