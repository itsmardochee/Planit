import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import ProtectedRoute from '../ProtectedRoute.jsx';

// Minimal auth reducer for mocking
const getStore = (authState = {}) =>
  configureStore({
    reducer: { auth: (state = authState) => state },
    preloadedState: { auth: authState },
  });

function renderWithProviders(ui, { store } = {}) {
  const testStore = store || getStore();
  return render(
    <Provider store={testStore}>
      <MemoryRouter initialEntries={['/dashboard']}>{ui}</MemoryRouter>
    </Provider>
  );
}

describe('ProtectedRoute', () => {
  it('renders child component when authenticated', () => {
    const store = getStore({ user: { name: 'Test' }, token: 'abc' });
    renderWithProviders(
      <ProtectedRoute>
        <div>Dashboard</div>
      </ProtectedRoute>,
      { store }
    );
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    const store = getStore({ user: null, token: null });
    renderWithProviders(
      <ProtectedRoute>
        <div>Dashboard</div>
      </ProtectedRoute>,
      { store }
    );
    // Since <Navigate /> is used, nothing is rendered except the redirect
    // So we check that Dashboard is NOT present
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
  });
});
