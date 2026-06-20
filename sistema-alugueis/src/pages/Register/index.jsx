import { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  InputAdornment,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Phone,
  Badge,
  Business,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import AuthLayout from '../../components/AuthLayout';
import {
  FormContainer,
  StyledActionLink,
} from '../../components/AuthLayout/styles';
import { saveAccount } from '../../services/authService';
import { useModal } from '../../contexts/ModalContext';
import { getErrorMessage } from '../../utils/errors';
import { applyCpfMask, applyCnpjMask } from '../../utils/masks';
import { dateFieldSx } from '../../utils/formStyles';

export default function Register() {
  const navigate = useNavigate();
  const { showModal } = useModal();
  const [personType, setPersonType] = useState('PF');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    document: '',
    rg: '',
    dataNascimento: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function handlePersonTypeChange(e, newType) {
    if (!newType) return;
    setPersonType(newType);
    setFormData({
      ...formData,
      document: '',
      rg: '',
      dataNascimento: '',
    });
  }

  async function handleChange(e) {
    let { name, value } = e.target;

    if (name === 'document') {
      value = personType === 'PF' ? applyCpfMask(value) : applyCnpjMask(value);
    }

    setFormData({ ...formData, [name]: value });
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      showModal({
        title: 'Atenção',
        message: 'As senhas não coincidem!',
        type: 'warning',
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        document: formData.document,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        personType,
        ...(personType === 'PF' && {
          rg: formData.rg,
          dataNascimento: formData.dataNascimento,
        }),
      };

      const userData = await saveAccount(payload);

      localStorage.setItem(
        'userRegistrationData',
        JSON.stringify({
          userId: userData.data.user.id,
          name: formData.fullName,
          email: userData.data.user.email,
          phone: formData.phone,
        })
      );

      navigate('/verify-code');
    } catch (error) {
      console.error(error);
      showModal({
        title: 'Erro',
        message: getErrorMessage(
          error,
          'Não foi possível realizar o cadastro. Tente novamente.'
        ),
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Criar Nova Conta"
      subtitle="Preencha os dados abaixo para se cadastrar no sistema"
      isLoading={isLoading}
    >
      <FormContainer noValidate>
        <ToggleButtonGroup
          value={personType}
          exclusive
          onChange={handlePersonTypeChange}
          fullWidth
          sx={{ mt: 1, mb: 1 }}
        >
          <ToggleButton value="PF">
            <Person sx={{ mr: 1 }} fontSize="small" />
            Pessoa Física
          </ToggleButton>
          <ToggleButton value="PJ">
            <Business sx={{ mr: 1 }} fontSize="small" />
            Pessoa Jurídica
          </ToggleButton>
        </ToggleButtonGroup>

        <TextField
          margin="normal"
          required
          fullWidth
          id="fullName"
          label="Nome Completo"
          name="fullName"
          autoComplete="name"
          value={formData.fullName}
          onChange={handleChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Person sx={{ color: 'action.active' }} />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="E-mail"
          name="email"
          autoComplete="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
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
          id="phone"
          label="Telefone"
          name="phone"
          autoComplete="tel"
          value={formData.phone}
          onChange={handleChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Phone sx={{ color: 'action.active' }} />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          id="document"
          label={personType === 'PF' ? 'CPF' : 'CNPJ'}
          name="document"
          value={formData.document}
          onChange={handleChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Badge sx={{ color: 'action.active' }} />
              </InputAdornment>
            ),
          }}
        />

        {personType === 'PF' && (
          <>
            <TextField
              margin="normal"
              fullWidth
              id="rg"
              label="RG (opcional)"
              name="rg"
              value={formData.rg}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Badge sx={{ color: 'action.active' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="dataNascimento"
              label="Data de Nascimento"
              name="dataNascimento"
              type="date"
              value={formData.dataNascimento}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              sx={dateFieldSx}
            />
          </>
        )}

        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Senha"
          type={showPassword ? 'text' : 'password'}
          id="password"
          autoComplete="new-password"
          value={formData.password}
          onChange={handleChange}
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
          label="Confirmar Senha"
          type={showPassword ? 'text' : 'password'}
          id="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
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
          type="button"
          onClick={handleRegister}
          fullWidth
          variant="contained"
          size="large"
          sx={{ mt: 4, mb: 3, py: 1.5, fontSize: '1rem' }}
        >
          Cadastrar
        </Button>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" component="span">
            Já possui conta?{' '}
            <StyledActionLink component={RouterLink} to="/login">
              Faça login
            </StyledActionLink>
          </Typography>
        </Box>
      </FormContainer>
    </AuthLayout>
  );
}
