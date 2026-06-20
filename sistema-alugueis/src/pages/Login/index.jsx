import { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { login, sendPasswordResetCode } from '../../services/authService';
import { useModal } from '../../contexts/ModalContext';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../utils/errors';
import AuthLayout from '../../components/AuthLayout';

import {
  FormContainer,
  StyledLink,
  StyledActionLink,
} from '../../components/AuthLayout/styles';

export default function Login() {
  const { showModal } = useModal();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await login({ email, password });

      if (response.data.requiresPasswordSetup) {
        await sendPasswordResetCode({ email });

        navigate('/verify-reset-code', { state: { email, mode: 'setup' } });
        return;
      }

      const { userData, token } = response.data;

      signIn({ userData, token });

      navigate('/home');
    } catch (error) {
      console.error(error);
      showModal({
        title: 'Erro',
        message: getErrorMessage(
          error,
          'Não foi possível realizar o login. Tente novamente.'
        ),
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Bem-vindo de volta"
      subtitle="Faça login para acessar o sistema de aluguéis"
      isLoading={isLoading}
    >
      <FormContainer noValidate>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="E-mail"
          name="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Email sx={{ color: 'action.active' }} />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Senha"
          type={showPassword ? 'text' : 'password'}
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock sx={{ color: 'action.active' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="alternar visibilidade da senha"
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 3 }}>
          <StyledLink
            component={RouterLink}
            to="/esqueci-senha"
            variant="body2"
          >
            Esqueceu a senha?
          </StyledLink>
        </Box>

        <Button
          type="button"
          onClick={handleLogin}
          fullWidth
          variant="contained"
          size="large"
          sx={{ py: 1.5, fontSize: '1rem' }}
        >
          Entrar
        </Button>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" component="span">
            Não tem uma conta?{' '}
            <StyledActionLink component={RouterLink} to="/register">
              Cadastre-se
            </StyledActionLink>
          </Typography>
        </Box>
      </FormContainer>
    </AuthLayout>
  );
}
