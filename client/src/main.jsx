import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { store } from './store/index.js';
import { theme } from './theme/theme.js';
import { ToastProvider } from './components/ToastProvider.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import './i18n'; // Import i18n configuration
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <MuiThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <ToastProvider>
              <App />
            </ToastProvider>
          </BrowserRouter>
        </MuiThemeProvider>
      </ThemeProvider>
    </Provider>
  </StrictMode>
);
