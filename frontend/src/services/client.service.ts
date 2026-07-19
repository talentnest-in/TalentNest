import { api } from '@/lib/api';
import type { ClientProfile, ClientDashboard } from '@/types';

export const clientService = {
  getProfile: async (): Promise<ClientProfile | null> => {
    const res = await api.get('/clients/me');
    const data = res.data?.data ?? res.data;
    return data?.profile ?? data;
  },

  updateProfile: async (data: Partial<ClientProfile>): Promise<ClientProfile> => {
    const res = await api.put('/clients/me', data);
    const result = res.data?.data ?? res.data;
    return result?.profile ?? result;
  },

  getDashboard: async (): Promise<ClientDashboard> => {
    const res = await api.get('/clients/dashboard');
    const data = res.data?.data ?? res.data;
    return {
      activeJobs: data?.activeJobs ?? 0,
      draftJobs: data?.draftJobs ?? 0,
      totalJobs: data?.totalJobs ?? 0,
      closedJobs: data?.closedJobs ?? 0,
      recentJobs: Array.isArray(data?.recentJobs) ? data.recentJobs : [],
      company: data?.company ?? null,
    };
  },

  uploadLogo: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post('/clients/upload-logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const data = res.data?.data ?? res.data;
    return data?.logoUrl || '';
  },
};
