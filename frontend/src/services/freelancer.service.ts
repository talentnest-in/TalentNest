import { api } from '@/lib/api';
import type { FreelancerProfile, Skill, Experience, Education } from '@/types';

export const freelancerService = {
  getProfile: async (): Promise<FreelancerProfile> => {
    const response = await api.get('/freelancers/me');
    const data = response.data?.data ?? response.data;
    return data?.profile ?? data;
  },

  upsertProfile: async (data: Partial<FreelancerProfile>): Promise<FreelancerProfile> => {
    const response = await api.put('/freelancers/me', data);
    const result = response.data?.data ?? response.data;
    return result?.profile ?? result;
  },

  uploadResume: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/freelancers/upload-resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const data = response.data?.data ?? response.data;
    return data?.resumeUrl || '';
  },

  uploadAvatar: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/freelancers/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const data = response.data?.data ?? response.data;
    return data?.avatar || '';
  },

  addSkill: async (name: string): Promise<Skill> => {
    const response = await api.post('/freelancers/skills', { name });
    const data = response.data?.data ?? response.data;
    return data?.skill ?? data;
  },

  deleteSkill: async (id: string): Promise<void> => {
    await api.delete(`/freelancers/skills/${id}`);
  },

  addExperience: async (data: Omit<Experience, 'id'>): Promise<Experience> => {
    const response = await api.post('/freelancers/experience', data);
    const result = response.data?.data ?? response.data;
    return result?.experience ?? result;
  },

  updateExperience: async (id: string, data: Omit<Experience, 'id'>): Promise<Experience> => {
    const response = await api.put(`/freelancers/experience/${id}`, data);
    const result = response.data?.data ?? response.data;
    return result?.experience ?? result;
  },

  deleteExperience: async (id: string): Promise<void> => {
    await api.delete(`/freelancers/experience/${id}`);
  },

  addEducation: async (data: Omit<Education, 'id'>): Promise<Education> => {
    const response = await api.post('/freelancers/education', data);
    const result = response.data?.data ?? response.data;
    return result?.education ?? result;
  },

  updateEducation: async (id: string, data: Omit<Education, 'id'>): Promise<Education> => {
    const response = await api.put(`/freelancers/education/${id}`, data);
    const result = response.data?.data ?? response.data;
    return result?.education ?? result;
  },

  deleteEducation: async (id: string): Promise<void> => {
    await api.delete(`/freelancers/education/${id}`);
  },
};
