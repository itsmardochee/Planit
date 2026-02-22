import { ThemeProvider as MuiThemeProvider } from '@mui/material';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';
import { lightTheme, darkTheme } from './theme';

/**
 * Wrapper component that applies the correct MUI theme based on the dark mode state
 */
const MuiThemeWrapper = ({ children }) => {
  const { isDarkMode } = useTheme();

  return (
    <MuiThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      {children}
    </MuiThemeProvider>
  );
};

MuiThemeWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};

export default MuiThemeWrapper;
