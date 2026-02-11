import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import Login from '../Login.jsx';
import * as apiModule from '../../utils/api';

// Mock router navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: key => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: key => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Helper to render with providers
function renderWithProviders(ui, { store } = {}) {
  const testStore =
    store ||
    configureStore({
      reducer: {
        auth: (state = { user: null, token: null }) => state,
      },
    });
  return render(
    <Provider store={testStore}>
      <ThemeProvider>
        <I18nextProvider i18n={i18n}>
          <MemoryRouter>{ui}</MemoryRouter>
        </I18nextProvider>
      </ThemeProvider>
    </Provider>
  );
}

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    mockNavigate.mockClear();
  });
  it('renders email and password fields', () => {
    renderWithProviders(<Login />);
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your password/i)).toBeInTheDocument();
  });

  it('renders sign in button', () => {
    renderWithProviders(<Login />);
    expect(
      screen.getByRole('button', { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it('shows error message on failed login', async () => {
    // Mock the login API to reject
    vi.spyOn(apiModule.authAPI, 'login').mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });
    renderWithProviders(<Login />);
    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/your password/i);
    emailInput.value = 'test@example.com';
    passwordInput.value = 'wrongpassword';
    // Fire change events to update state
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    const button = screen.getByRole('button', { name: /sign in/i });
    button.click();
    const error = await screen.findByText(/invalid credentials/i);
    expect(error).toBeInTheDocument();
  });

  it('successfully logs in a user', async () => {
    const mockUser = { id: '1', email: 'test@example.com', username: 'Test' };
    const mockToken = 'mock-jwt-token';

    vi.spyOn(apiModule.authAPI, 'login').mockResolvedValueOnce({
      data: {
        success: true,
        data: { user: mockUser, token: mockToken },
      },
    });

    renderWithProviders(<Login />);

    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/your password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(apiModule.authAPI.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockLocalStorage.getItem('token')).toBe(mockToken);
      expect(mockLocalStorage.getItem('user')).toBe(JSON.stringify(mockUser));
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('switches to register mode', () => {
    renderWithProviders(<Login />);

    expect(
      screen.getByRole('heading', { name: /sign in to planit/i })
    ).toBeInTheDocument();

    const switchButton = screen.getByRole('button', {
      name: /don't have an account|create one/i,
    });
    fireEvent.click(switchButton);

    expect(
      screen.getByRole('heading', { name: /create an account/i })
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/johndoe/i)).toBeInTheDocument();
  });

  it('successfully registers a new user and auto-logs in', async () => {
    const mockUser = {
      id: '1',
      email: 'newuser@example.com',
      username: 'NewUser',
    };
    const mockToken = 'mock-jwt-token';

    vi.spyOn(apiModule.authAPI, 'register').mockResolvedValueOnce({
      data: { success: true },
    });
    vi.spyOn(apiModule.authAPI, 'login').mockResolvedValueOnce({
      data: {
        success: true,
        data: { user: mockUser, token: mockToken },
      },
    });

    renderWithProviders(<Login />);

    // Switch to register mode
    const switchButton = screen.getByRole('button', {
      name: /don't have an account|create one/i,
    });
    fireEvent.click(switchButton);

    // Fill in registration form
    const usernameInput = screen.getByPlaceholderText(/johndoe/i);
    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    const passwordInputs = screen.getAllByPlaceholderText(/your password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/confirm password/i);

    fireEvent.change(usernameInput, { target: { value: 'NewUser' } });
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.change(passwordInputs[0], { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', {
      name: /create account|sign up/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(apiModule.authAPI.register).toHaveBeenCalledWith({
        username: 'NewUser',
        email: 'newuser@example.com',
        password: 'password123',
      });
      expect(apiModule.authAPI.login).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
      });
      expect(mockLocalStorage.getItem('token')).toBe(mockToken);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error on password mismatch during registration', async () => {
    renderWithProviders(<Login />);

    // Switch to register mode
    const switchButton = screen.getByRole('button', {
      name: /don't have an account|create one/i,
    });
    fireEvent.click(switchButton);

    // Fill in form with mismatched passwords
    const usernameInput = screen.getByPlaceholderText(/johndoe/i);
    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    const passwordInputs = screen.getAllByPlaceholderText(/your password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/confirm password/i);

    fireEvent.change(usernameInput, { target: { value: 'TestUser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInputs[0], { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different' } });

    const submitButton = screen.getByRole('button', {
      name: /create account|sign up/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/passwords do not match|mismatch/i)
      ).toBeInTheDocument();
    });
  });
});
