import { api } from '@/lib/api';
import type { FreelancerProfile, Skill, Experience, Education } from '@/types';

export const freelancerService = {
  getProfile: async (): Promise<FreelancerProfile> => {
    const response = await api.get('/freelancers/me');
    return response.data.profile;
  },

  upsertProfile: async (data: Partial<FreelancerProfile>): Promise<FreelancerProfile> => {
    const response = await api.put('/freelancers/me', data);
    return response.data.profile;
  },

  uploadResume: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/freelancers/upload-resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.resumeUrl;
  },

  uploadAvatar: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/freelancers/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.avatar;
  },

  addSkill: async (name: string): Promise<Skill> => {
    const response = await api.post('/freelancers/skills', { name });
    return response.data.skill;
  },

  deleteSkill: async (id: string): Promise<void> => {
    await api.delete(`/freelancers/skills/${id}`);
  },

  addExperience: async (data: Omit<Experience, 'id'>): Promise<Experience> => {
    const response = await api.post('/freelancers/experience', data);
    return response.data.experience;
  },

  updateExperience: async (id: string, data: Omit<Experience, 'id'>): Promise<Experience> => {
    const response = await api.put(`/freelancers/experience/${id}`, data);
    return response.data.experience;
  },

  deleteExperience: async (id: string): Promise<void> => {
    await api.delete(`/freelancers/experience/${id}`);
  },

  addEducation: async (data: Omit<Education, 'id'>): Promise<Education> => {
    const response = await api.post('/freelancers/education', data);
    return response.data.education;
  },

  updateEducation: async (id: string, data: Omit<Education, 'id'>): Promise<Education> => {
    const response = await api.put(`/freelancers/education/${id}`, data);
    return response.data.education;
  },

  deleteEducation: async (id: string): Promise<void> => {
    await api.delete(`/freelancers/education/${id}`);
  },
};
