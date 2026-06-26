import { api } from '@/lib/api';
import type { Company } from '@/types';

export const companyService = {
  getMyCompany: async (): Promise<Company | null> => {
    const res = await api.get('/clients/company');
    return res.data.company;
  },

  saveCompany: async (data: Partial<Company>): Promise<Company> => {
    const res = await api.post('/clients/company', data);
    return res.data.company;
  },

  uploadLogo: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post('/clients/company/upload-logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.logoUrl;
  },
};
