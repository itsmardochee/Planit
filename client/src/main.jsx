import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { CssBaseline } from '@mui/material';
import { store } from './store/index.js';
import MuiThemeWrapper from './theme/MuiThemeWrapper.jsx';
import { ToastProvider } from './components/ToastProvider.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import './i18n'; // Import i18n configuration
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <MuiThemeWrapper>
          <CssBaseline />
          <BrowserRouter>
            <ToastProvider>
              <App />
            </ToastProvider>
          </BrowserRouter>
        </MuiThemeWrapper>
      </ThemeProvider>
    </Provider>
  </StrictMode>
);
