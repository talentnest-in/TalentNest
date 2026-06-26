import { api } from '@/lib/api';
import type { PortfolioProject } from '@/types';

export const portfolioService = {
  getProjects: async (): Promise<PortfolioProject[]> => {
    const response = await api.get('/portfolio');
    return response.data.projects;
  },

  addProject: async (data: Omit<PortfolioProject, 'id'>): Promise<PortfolioProject> => {
    const response = await api.post('/portfolio', data);
    return response.data.project;
  },

  updateProject: async (id: string, data: Omit<PortfolioProject, 'id'>): Promise<PortfolioProject> => {
    const response = await api.put(`/portfolio/${id}`, data);
    return response.data.project;
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
    return response.data.imageUrl;
  },
};
