import { api } from '@/lib/api';
import type { Company } from '@/types';

export const companyService = {
  getMyCompany: async (): Promise<Company | null> => {
    const res = await api.get('/clients/company');
    const data = res.data?.data ?? res.data;
    return data?.company ?? null;
  },

  saveCompany: async (data: Partial<Company>): Promise<Company> => {
    const res = await api.post('/clients/company', data);
    const result = res.data?.data ?? res.data;
    return result?.company ?? result;
  },

  uploadLogo: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post('/clients/company/upload-logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const data = res.data?.data ?? res.data;
    return data?.logoUrl || '';
  },
};
