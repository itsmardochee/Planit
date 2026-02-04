import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '../../contexts/ThemeContext';
import Login from '../Login.jsx';
import { vi } from 'vitest';
import * as apiModule from '../../utils/api';

// RED phase: Write failing tests for Login page

// Helper to render with providers
function renderWithProviders(ui, { store } = {}) {
  const testStore =
    store ||
    configureStore({
      reducer: {}, // Add reducers if needed
    });
  return render(
    <Provider store={testStore}>
      <ThemeProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </ThemeProvider>
    </Provider>
  );
}

describe('Login Page', () => {
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
});
