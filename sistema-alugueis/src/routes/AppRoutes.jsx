import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import { NotFound } from '../pages/NotFound';
import Register from '../pages/Register';
import VerifyCode from '../pages/VerifyCode';
import ForgotPassword from '../pages/ForgotPassword';
import VerifyResetCode from '../pages/VerifyResetCode';
import Home from '../pages/Home';
import Properties from '../pages/Properties';
import Clients from '../pages/Clients';
import Leases from '../pages/Leases';
import Layout from '../components/Layout';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../hooks/useAuth';
import { STAFF_ROLES } from '../constants/enums';

export default function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? '/home' : '/login'} replace />}
      />

      {isAuthenticated ? (
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route element={<ProtectedRoute allowedRoles={STAFF_ROLES} />}>
            <Route path="/properties" element={<Properties />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/leases" element={<Leases />} />
          </Route>
        </Route>
      ) : (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-code" element={<VerifyCode />} />
          <Route path="/esqueci-senha" element={<ForgotPassword />} />
          <Route path="/verify-reset-code" element={<VerifyResetCode />} />
        </>
      )}

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
