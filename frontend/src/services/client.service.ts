import { api } from '@/lib/api';
import type { ClientProfile, ClientDashboard } from '@/types';

export const clientService = {
  getProfile: async (): Promise<ClientProfile | null> => {
    const res = await api.get('/clients/me');
    return res.data.profile;
  },

  updateProfile: async (data: Partial<ClientProfile>): Promise<ClientProfile> => {
    const res = await api.put('/clients/me', data);
    return res.data.profile;
  },

  getDashboard: async (): Promise<ClientDashboard> => {
    const res = await api.get('/clients/dashboard');
    return res.data;
  },

  uploadLogo: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post('/clients/upload-logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.logoUrl;
  },
};
