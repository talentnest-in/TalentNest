import { api } from '@/lib/api';

export interface Milestone {
  id: string;
  contractId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  amount: number;
  isFunded: boolean;
  isPaid: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  contractId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export const workspaceService = {
  async getMilestones(contractId: string): Promise<Milestone[]> {
    const response = await api.get(`/contracts/${contractId}/milestones`);
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  },

  async createMilestone(contractId: string, data: {
    title: string;
    description?: string;
    dueDate?: string;
    status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
    amount?: number;
    order?: number;
  }): Promise<Milestone> {
    const response = await api.post(`/contracts/${contractId}/milestones`, data);
    return response.data?.data ?? response.data;
  },

  async updateMilestone(contractId: string, id: string, data: Partial<{
    title: string;
    description: string | null;
    dueDate: string | null;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
    amount: number;
    order: number;
  }>): Promise<Milestone> {
    const response = await api.patch(`/contracts/${contractId}/milestones/${id}`, data);
    return response.data?.data ?? response.data;
  },

  async deleteMilestone(contractId: string, id: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/contracts/${contractId}/milestones/${id}`);
    return response.data?.data ?? response.data;
  },

  async fundMilestone(contractId: string, id: string): Promise<Milestone> {
    const response = await api.post(`/contracts/${contractId}/milestones/${id}/fund`);
    return response.data?.data ?? response.data;
  },

  async releaseMilestone(contractId: string, id: string): Promise<Milestone> {
    const response = await api.post(`/contracts/${contractId}/milestones/${id}/release`);
    return response.data?.data ?? response.data;
  },

  async getNotes(contractId: string): Promise<Note[]> {
    const response = await api.get(`/contracts/${contractId}/notes`);
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  },

  async createNote(contractId: string, data: {
    title: string;
    content: string;
  }): Promise<Note> {
    const response = await api.post(`/contracts/${contractId}/notes`, data);
    return response.data?.data ?? response.data;
  },

  async updateNote(contractId: string, id: string, data: Partial<{
    title: string;
    content: string;
  }>): Promise<Note> {
    const response = await api.patch(`/contracts/${contractId}/notes/${id}`, data);
    return response.data?.data ?? response.data;
  },

  async deleteNote(contractId: string, id: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/contracts/${contractId}/notes/${id}`);
    return response.data?.data ?? response.data;
  },
};
