import { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Box,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { VpnKey, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { updatePassword } from '../../services/authService';
import { useModal } from '../../contexts/ModalContext';
import { getErrorMessage } from '../../utils/errors';

import AuthLayout from '../../components/AuthLayout';
import { FormContainer, StyledLink } from '../../components/AuthLayout/styles';
import { useAuth } from '../../hooks/useAuth';

export default function VerifyResetCode() {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { showModal } = useModal();
  const { signIn } = useAuth();

  const email = location.state?.email;
  const isSetup = location.state?.mode === 'setup';

  const texts = isSetup
    ? {
        title: 'Definir Senha',
        subtitle: (
          <>
            Insira o código enviado para <strong>{email}</strong> e defina
            sua senha de acesso.
          </>
        ),
        passwordLabel: 'Senha',
        confirmPasswordLabel: 'Confirmar Senha',
        fillWarning: 'Preencha todos os campos para definir sua senha.',
        successMessage: 'Senha definida com sucesso! Você já pode fazer login.',
        submitLabel: 'Definir Senha',
        accessRestrictedMessage: 'Por favor, faça login novamente.',
        redirectPath: '/login',
      }
    : {
        title: 'Redefinir Senha',
        subtitle: (
          <>
            Insira o código enviado para <strong>{email}</strong> e crie sua
            nova senha.
          </>
        ),
        passwordLabel: 'Nova Senha',
        confirmPasswordLabel: 'Confirmar Nova Senha',
        fillWarning: 'Preencha todos os campos para redefinir sua senha.',
        successMessage:
          'Senha redefinida com sucesso! Você já pode fazer login.',
        submitLabel: 'Redefinir Senha',
        accessRestrictedMessage:
          'Por favor, inicie o processo de recuperação de senha primeiro.',
        redirectPath: '/esqueci-senha',
      };

  useEffect(() => {
    if (!email) {
      showModal({
        title: 'Acesso Restrito',
        message: isSetup
          ? 'Por favor, faça login novamente.'
          : 'Por favor, inicie o processo de recuperação de senha primeiro.',
        type: 'warning',
      });
      navigate(isSetup ? '/login' : '/esqueci-senha');
    }
  }, [email, isSetup, navigate, showModal]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!code || !newPassword || !confirmPassword) {
      showModal({
        title: 'Atenção',
        message: texts.fillWarning,
        type: 'warning',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showModal({
        title: 'Atenção',
        message: 'As senhas não coincidem. Por favor, verifique.',
        type: 'warning',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await updatePassword({
        email,
        code,
        newPassword,
        confirmPassword,
      });

      showModal({
        title: 'Sucesso',
        message: texts.successMessage,
        type: 'success',
      });

      const { userData, token } = response.data;

      signIn({ userData, token });
      navigate('/home');
    } catch (error) {
      console.error(error);
      showModal({
        title: 'Erro',
        message: getErrorMessage(error, 'Não foi possível redefinir a senha. Tente novamente.'),
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={texts.title}
      subtitle={texts.subtitle}
      isLoading={isLoading}
    >
      <FormContainer onSubmit={handleResetPassword} noValidate>
        <TextField
          margin="normal"
          required
          fullWidth
          id="code"
          label="Código de Verificação"
          name="code"
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <VpnKey sx={{ color: 'action.active' }} />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          name="newPassword"
          label={texts.passwordLabel}
          type={showPassword ? 'text' : 'password'}
          id="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
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

        <TextField
          margin="normal"
          required
          fullWidth
          name="confirmPassword"
          label={texts.confirmPasswordLabel}
          type={showPassword ? 'text' : 'password'}
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={isLoading}
          sx={{ mt: 3, mb: 3, py: 1.5, fontSize: '1rem' }}
        >
          {texts.submitLabel}
        </Button>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <StyledLink component={RouterLink} to="/login">
            Voltar para o login
          </StyledLink>
        </Box>
      </FormContainer>
    </AuthLayout>
  );
}
