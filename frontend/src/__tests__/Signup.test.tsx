import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { Signup } from '../pages/Signup';

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
    register: vi.fn(),
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

describe('Signup Page', () => {
  it('renders the signup form', () => {
    renderWithProviders(<Signup />);
    expect(screen.getByText(/create an account/i)).toBeTruthy();
    expect(screen.getByLabelText(/full name/i)).toBeTruthy();
    expect(screen.getByLabelText(/email address/i)).toBeTruthy();
    expect(screen.getByLabelText(/password/i)).toBeTruthy();
  });

  it('renders role selection', () => {
    renderWithProviders(<Signup />);
    expect(screen.getByText(/i'm a freelancer/i)).toBeTruthy();
    expect(screen.getByText(/i'm hiring talent/i)).toBeTruthy();
  });
});
