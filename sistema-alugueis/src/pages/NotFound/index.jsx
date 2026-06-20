import { Button } from '@mui/material';
import SearchOffOutlinedIcon from '@mui/icons-material/SearchOffOutlined';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

import { Container, Card, IconBadge, Code, Title, Subtitle } from './styles';

export function NotFound() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <Container>
      <Card elevation={0}>
        <IconBadge>
          <SearchOffOutlinedIcon />
        </IconBadge>

        <Code>404</Code>
        <Title component="h1" variant="h5">
          Página não encontrada
        </Title>
        <Subtitle variant="body2">
          O endereço acessado não existe ou foi movido.
        </Subtitle>

        <Button
          variant="contained"
          size="large"
          sx={{ py: 1.5, px: 4, fontSize: '1rem' }}
          onClick={() => navigate(isAuthenticated ? '/home' : '/login')}
        >
          Voltar para o início
        </Button>
      </Card>
    </Container>
  );
}
