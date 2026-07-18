import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { Login } from '../pages/Login';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
  },
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>,
  );
}

describe('Login Page', () => {
  it('renders the login form', () => {
    renderWithProviders(<Login />);
    expect(screen.getByText(/welcome back/i)).toBeTruthy();
    expect(screen.getByLabelText(/email address/i)).toBeTruthy();
    expect(screen.getByLabelText(/password/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /log in/i })).toBeTruthy();
  });

  it('renders sign up link', () => {
    renderWithProviders(<Login />);
    expect(screen.getByText(/don't have an account/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /sign up/i })).toBeTruthy();
  });

  it('renders forgot password link', () => {
    renderWithProviders(<Login />);
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeTruthy();
  });
});
