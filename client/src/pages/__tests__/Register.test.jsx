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

function renderWithProviders(ui, { store } = {}) {
  const testStore =
    store ||
    configureStore({
      reducer: {
        auth: (state = {}) => state,
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

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders username, email, password, and confirm password fields', () => {
    renderWithProviders(<Login />);
    fireEvent.click(
      screen.getByRole('button', {
        name: /don't have an account\? create one/i,
      })
    );
    expect(
      screen.getByPlaceholderText(/johndoe|your username/i)
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(
      screen.getAllByPlaceholderText(/your password/i)[0]
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/confirm password/i)
    ).toBeInTheDocument();
  });

  it('renders create account button', () => {
    renderWithProviders(<Login />);
    fireEvent.click(
      screen.getByRole('button', {
        name: /don't have an account\? create one/i,
      })
    );
    expect(
      screen.getByRole('button', { name: /create account/i })
    ).toBeInTheDocument();
  });

  it('shows error message on password mismatch', async () => {
    renderWithProviders(<Login />);
    fireEvent.click(
      screen.getByRole('button', {
        name: /don't have an account\? create one/i,
      })
    );

    const usernameInput = screen.getByPlaceholderText(/johndoe|your username/i);
    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    const passwordInput = screen.getAllByPlaceholderText(/your password/i)[0];
    const confirmInput = screen.getByPlaceholderText(/confirm password/i);

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'differentpass' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    const error = await screen.findByText(/passwords do not match/i);
    expect(error).toBeInTheDocument();
  });

  it('shows error message on failed registration', async () => {
    vi.spyOn(apiModule.authAPI, 'register').mockRejectedValueOnce({
      response: { data: { message: 'Email already exists' } },
    });
    renderWithProviders(<Login />);
    fireEvent.click(
      screen.getByRole('button', {
        name: /don't have an account\? create one/i,
      })
    );

    const usernameInput = screen.getByPlaceholderText(/johndoe|your username/i);
    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    const passwordInput = screen.getAllByPlaceholderText(/your password/i)[0];
    const confirmInput = screen.getByPlaceholderText(/confirm password/i);

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });
});
