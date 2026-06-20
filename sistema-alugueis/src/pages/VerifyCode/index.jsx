import { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  InputAdornment,
} from '@mui/material';
import { VpnKey } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  verifyRegisterCode,
  resendRegisterCode,
} from '../../services/authService';
import { useModal } from '../../contexts/ModalContext';
import { getErrorMessage } from '../../utils/errors';

import AuthLayout from '../../components/AuthLayout';
import {
  FormContainer,
  StyledLink,
  StyledActionLink,
} from '../../components/AuthLayout/styles';
import { useAuth } from '../../hooks/useAuth';

export default function VerifyCode() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { showModal } = useModal();

  const userData = (() => {
    const savedData = localStorage.getItem('userRegistrationData');
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (error) {
        console.error('Erro ao ler dados de registro do usuário:', error);
      }
    }
    return { userId: null, email: null };
  })();

  useEffect(() => {
    if (!userData.email || !userData.userId) {
      showModal({
        title: 'Acesso Restrito',
        message: 'Por favor, realize o cadastro antes de verificar o código.',
        type: 'warning',
      });
      navigate('/register');
    }
  }, [userData.email, userData.userId, navigate, showModal]);

  async function handleVerify(e) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await verifyRegisterCode({
        code,
        userId: userData.userId,
      });

      signIn({ userData, token: response.data.token });
      localStorage.removeItem('userRegistrationData');

      navigate('/home');
    } catch (error) {
      console.error(error);
      showModal({
        title: 'Erro',
        message: getErrorMessage(
          error,
          'Não foi possível verificar o código. Tente novamente.'
        ),
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function resendEmail() {
    setIsLoading(true);
    try {
      if (!userData.email || !userData.userId) {
        showModal({
          title: 'Erro de Cadastro',
          message:
            'Dados do usuário não encontrados. Por favor, cadastre-se novamente.',
          type: 'error',
        });
        return;
      }

      await resendRegisterCode({
        email: userData.email,
        userId: userData.userId,
      });

      showModal({
        title: 'Sucesso',
        message: 'Código reenviado com sucesso!',
        type: 'success',
      });
    } catch (error) {
      console.error('Erro ao reenviar o código:', error);
      showModal({
        title: 'Atenção',
        message: getErrorMessage(
          error,
          'Não foi possível reenviar o código. Tente novamente.'
        ),
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Verifique seu E-mail"
      subtitle={
        <>
          Enviamos um código de verificação para{' '}
          <strong>{userData.email || 'seu e-mail'}</strong>. Por favor, insira-o
          abaixo.
        </>
      }
      isLoading={isLoading}
    >
      <FormContainer onSubmit={handleVerify} noValidate>
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

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          sx={{ mt: 3, mb: 3, py: 1.5, fontSize: '1rem' }}
        >
          Verificar Código
        </Button>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" component="span">
            Não recebeu o código?{' '}
            <StyledActionLink
              component="button"
              type="button"
              variant="body2"
              onClick={resendEmail}
            >
              Reenviar
            </StyledActionLink>
          </Typography>
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <StyledLink component={RouterLink} to="/register">
            Voltar para o cadastro
          </StyledLink>
        </Box>
      </FormContainer>
    </AuthLayout>
  );
}
