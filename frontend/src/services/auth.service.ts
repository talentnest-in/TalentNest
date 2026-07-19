import { api } from '@/lib/api';
import type { AuthResponse } from '@/types';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'FREELANCER' | 'CLIENT';
}

export interface LoginData {
  email: string;
  password: string;
}

export const authService = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', data);
    return res.data;
  },

  selectRole: async (data: { role: 'FREELANCER' | 'CLIENT' }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/onboarding/select-role', data);
    return res.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getMe: async () => {
    const res = await api.get<{ user: AuthResponse['user'] }>('/auth/me');
    return res.data?.user;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const res = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const res = await api.post<{ message: string }>('/auth/reset-password', { token, password });
    return res.data;
  },
};
