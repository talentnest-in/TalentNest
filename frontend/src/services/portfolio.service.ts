import { api } from '@/lib/api';
import type { PortfolioProject } from '@/types';

export const portfolioService = {
  getProjects: async (): Promise<PortfolioProject[]> => {
    const response = await api.get('/portfolio');
    const data = response.data?.data ?? response.data;
    const items = data?.projects ?? data;
    return Array.isArray(items) ? items : [];
  },

  addProject: async (data: Omit<PortfolioProject, 'id'>): Promise<PortfolioProject> => {
    const response = await api.post('/portfolio', data);
    const result = response.data?.data ?? response.data;
    return result?.project ?? result;
  },

  updateProject: async (id: string, data: Omit<PortfolioProject, 'id'>): Promise<PortfolioProject> => {
    const response = await api.put(`/portfolio/${id}`, data);
    const result = response.data?.data ?? response.data;
    return result?.project ?? result;
  },

  deleteProject: async (id: string): Promise<void> => {
    await api.delete(`/portfolio/${id}`);
  },

  uploadProjectImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/portfolio/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const data = response.data?.data ?? response.data;
    return data?.imageUrl || '';
  },
};
