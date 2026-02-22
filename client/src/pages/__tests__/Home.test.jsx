import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import Home from '../Home';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useAuth hook
let mockIsAuthenticated = false;
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
  }),
}));

// Helper to render with providers
function renderWithProviders(ui) {
  const store = configureStore({
    reducer: {
      auth: (state = { user: null, token: null }) => state,
    },
  });

  return render(
    <Provider store={store}>
      <ThemeProvider>
        <I18nextProvider i18n={i18n}>
          <MemoryRouter>{ui}</MemoryRouter>
        </I18nextProvider>
      </ThemeProvider>
    </Provider>
  );
}

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockIsAuthenticated = false;
  });

  it('renders the home page for unauthenticated users', () => {
    renderWithProviders(<Home />);

    // Check for Planit title
    expect(screen.getByText('Planit')).toBeInTheDocument();

    // Check for hero title
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /plan your success|planifiez votre réussite/i,
      })
    ).toBeInTheDocument();
  });

  it('redirects to dashboard when user is authenticated', () => {
    mockIsAuthenticated = true;

    renderWithProviders(<Home />);

    waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('navigates to login page when clicking nav login button', () => {
    renderWithProviders(<Home />);

    const loginButton = screen.getByRole('button', {
      name: /login|connexion/i,
    });
    fireEvent.click(loginButton);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('navigates to login page when clicking "Get Started" button', () => {
    renderWithProviders(<Home />);

    const getStartedButton = screen.getByRole('button', {
      name: /get started|commencer/i,
    });
    fireEvent.click(getStartedButton);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('navigates to login with register tab when clicking "Sign Up" button', () => {
    renderWithProviders(<Home />);

    const signUpButton = screen.getByRole('button', {
      name: /sign up|créer un compte/i,
    });
    fireEvent.click(signUpButton);

    expect(mockNavigate).toHaveBeenCalledWith('/login?tab=register');
  });

  it('displays three feature cards', () => {
    renderWithProviders(<Home />);

    // Check for feature emojis
    expect(screen.getByText('📋')).toBeInTheDocument();
    expect(screen.getByText('🎯')).toBeInTheDocument();
    expect(screen.getByText('🚀')).toBeInTheDocument();
  });

  it('displays tech stack section with technologies', () => {
    renderWithProviders(<Home />);

    // Check for tech stack items
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    expect(screen.getByText('MongoDB')).toBeInTheDocument();
    expect(screen.getByText('Tailwind CSS')).toBeInTheDocument();
  });

  it('renders dark mode toggle', () => {
    renderWithProviders(<Home />);

    const darkModeButton = screen.getByRole('button', {
      name: /switch to dark mode|passer en mode sombre/i,
    });
    expect(darkModeButton).toBeInTheDocument();
  });

  it('renders language selector', () => {
    renderWithProviders(<Home />);

    const languageSelector = screen.getByLabelText(/select language/i);
    expect(languageSelector).toBeInTheDocument();
  });

  it('returns null when user is authenticated (prevents flash)', () => {
    mockIsAuthenticated = true;

    const { container } = renderWithProviders(<Home />);

    // Component should return null when authenticated
    waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
