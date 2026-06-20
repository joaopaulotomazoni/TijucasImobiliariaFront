import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';
import AppRoutes from './routes/AppRoutes';
import { ModalProvider } from './contexts/ModalContext';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <MuiThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <ModalProvider>
            <Router>
              <AppRoutes />
            </Router>
          </ModalProvider>
        </AuthProvider>
      </StyledThemeProvider>
    </MuiThemeProvider>
  );
}

export default App;
