import { useState } from 'react';
import { TextField, Button, Box, InputAdornment } from '@mui/material';
import { Email, ArrowBack } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { sendPasswordResetCode } from '../../services/authService';
import { useModal } from '../../contexts/ModalContext';
import { getErrorMessage } from '../../utils/errors';

import AuthLayout from '../../components/AuthLayout';
import {
  FormContainer,
  StyledActionLink,
} from '../../components/AuthLayout/styles';

export default function ForgotPassword() {
  const { showModal } = useModal();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRecoverPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      showModal({
        title: 'Atenção',
        message: 'Por favor, informe seu e-mail.',
        type: 'warning',
      });
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetCode({ email });

      showModal({
        title: 'Sucesso',
        message:
          'Se houver um cadastro com este e-mail, enviaremos as instruções para redefinição de senha.',
        type: 'success',
      });
      navigate('/verify-reset-code', { state: { email } });
    } catch (error) {
      console.error(error);
      showModal({
        title: 'Erro',
        message: getErrorMessage(error, 'Não foi possível solicitar a recuperação de senha. Tente novamente.'),
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Esqueceu sua senha?"
      subtitle="Informe seu e-mail abaixo e enviaremos um link para você criar uma nova senha"
      isLoading={isLoading}
    >
      <FormContainer noValidate onSubmit={handleRecoverPassword}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="E-mail cadastrado"
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

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={isLoading}
          sx={{ py: 1.5, fontSize: '1rem', mt: 3 }}
        >
          Enviar código de verificação
        </Button>

        <Box
          sx={{
            mt: 4,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ArrowBack sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
          <StyledActionLink component={RouterLink} to="/login">
            Voltar para o login
          </StyledActionLink>
        </Box>
      </FormContainer>
    </AuthLayout>
  );
}
