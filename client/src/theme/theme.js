import { createTheme } from '@mui/material/styles';

// Global MUI theme configuration
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6C5CE7', // Purple
    },
    secondary: {
      main: '#00CEC9', // Teal
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  },
});
