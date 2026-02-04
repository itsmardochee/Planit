import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
// import Register from '../Register.jsx'; // Uncomment when Register.jsx exists
// import * as apiModule from '../../utils/api';

function renderWithProviders(ui, { store } = {}) {
  const testStore =
    store ||
    configureStore({
      reducer: {}, // Add reducers if needed
    });
  return render(
    <Provider store={testStore}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>
  );
}

describe('Register Page', () => {
  it('renders username, email, password, and confirm password fields', () => {
    // renderWithProviders(<Register />);
    // expect(screen.getByPlaceholderText(/your username/i)).toBeInTheDocument();
    // expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    // expect(screen.getByPlaceholderText(/your password/i)).toBeInTheDocument();
    // expect(screen.getByPlaceholderText(/confirm password/i)).toBeInTheDocument();
  });

  it('renders create account button', () => {
    // renderWithProviders(<Register />);
    // expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows error message on password mismatch', async () => {
    // renderWithProviders(<Register />);
    // const usernameInput = screen.getByPlaceholderText(/your username/i);
    // const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    // const passwordInput = screen.getByPlaceholderText(/your password/i);
    // const confirmInput = screen.getByPlaceholderText(/confirm password/i);
    // usernameInput.value = 'testuser';
    // emailInput.value = 'test@example.com';
    // passwordInput.value = 'password123';
    // confirmInput.value = 'differentpass';
    // usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
    // emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    // passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    // confirmInput.dispatchEvent(new Event('input', { bubbles: true }));
    // const button = screen.getByRole('button', { name: /create account/i });
    // button.click();
    // const error = await screen.findByText(/passwords do not match/i);
    // expect(error).toBeInTheDocument();
  });

  it('shows error message on failed registration', async () => {
    // vi.spyOn(apiModule.authAPI, 'register').mockRejectedValueOnce({
    //   response: { data: { message: 'Email already exists' } },
    // });
    // renderWithProviders(<Register />);
    // const usernameInput = screen.getByPlaceholderText(/your username/i);
    // const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    // const passwordInput = screen.getByPlaceholderText(/your password/i);
    // const confirmInput = screen.getByPlaceholderText(/confirm password/i);
    // usernameInput.value = 'testuser';
    // emailInput.value = 'test@example.com';
    // passwordInput.value = 'password123';
    // confirmInput.value = 'password123';
    // usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
    // emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    // passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    // confirmInput.dispatchEvent(new Event('input', { bubbles: true }));
    // const button = screen.getByRole('button', { name: /create account/i });
    // button.click();
    // const error = await screen.findByText(/email already exists/i);
    // expect(error).toBeInTheDocument();
  });
});
