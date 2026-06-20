import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import PeopleIcon from '@mui/icons-material/People';
import DescriptionIcon from '@mui/icons-material/Description';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../hooks/useAuth';
import { ROLES, STAFF_ROLES } from '../../constants/enums';
import logo from '../../assets/48ff6302-cd6e-47a4-be73-1111c32fc587_md.webp';

import {
  Root,
  Drawer,
  DrawerHeader,
  BrandLogoBadge,
  NavSectionLabel,
  NavList,
  NavItem,
  DrawerFooter,
  UserCard,
  UserAvatar,
  MainContent,
} from './styles';

const getInitials = (name) =>
  (name || 'Corretor')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

export default function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const userMenuOpen = Boolean(anchorEl);

  const handleLogout = () => {
    setAnchorEl(null);
    signOut();
    navigate('/login');
  };

  const isStaff = STAFF_ROLES.includes(user?.role);

  const navItems = [
    { path: '/home', label: 'Dashboard', icon: <DashboardIcon /> },
    ...(isStaff
      ? [
          { path: '/properties', label: 'Imóveis', icon: <HomeWorkIcon /> },
          { path: '/clients', label: 'Clientes', icon: <PeopleIcon /> },
          { path: '/leases', label: 'Contratos', icon: <DescriptionIcon /> },
        ]
      : []),
  ];

  const roleLabel = isStaff
    ? 'Corretor'
    : user?.role === ROLES.CLIENTE
      ? 'Cliente'
      : 'Usuário';

  return (
    <Root>
      <Drawer variant="permanent" anchor="left">
        <DrawerHeader>
          <BrandLogoBadge>
            <img src={logo} alt="Tijucas Imobiliária" />
          </BrandLogoBadge>
        </DrawerHeader>
        <NavSectionLabel>Menu</NavSectionLabel>
        <NavList>
          {navItems.map((item) => (
            <NavItem key={item.path} to={item.path}>
              {item.icon}
              {item.label}
            </NavItem>
          ))}
        </NavList>

        <DrawerFooter>
          <UserCard onClick={(e) => setAnchorEl(e.currentTarget)}>
            <UserAvatar>{getInitials(user?.name)}</UserAvatar>
            <div className="user-meta">
              <div className="user-name">{user?.name || 'Corretor'}</div>
              <div className="user-role">{roleLabel}</div>
            </div>
          </UserCard>
          <Menu
            anchorEl={anchorEl}
            open={userMenuOpen}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Sair</ListItemText>
            </MenuItem>
          </Menu>
        </DrawerFooter>
      </Drawer>

      <MainContent>
        <Outlet />
      </MainContent>
    </Root>
  );
}
