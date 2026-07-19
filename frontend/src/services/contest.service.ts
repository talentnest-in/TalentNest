import { api } from '@/lib/api';
import type {
  Contest,
  ContestSubmission,
  ContestParticipant,
  ContestAnalytics,
} from '@/types';

export interface ContestFilters {
  page?: number;
  limit?: number;
  sort?: 'newest' | 'ending_soon' | 'popular' | 'prize';
  category?: string;
  difficulty?: string;
  status?: string;
  search?: string;
}

export interface PaginatedContests {
  data: Contest[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateContestPayload {
  title: string;
  description: string;
  category: string;
  skills: string[];
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  prizeAmount: number;
  registrationDeadline: string;
  submissionDeadline: string;
  maxParticipants?: number | null;
  visibility?: 'PUBLIC' | 'PRIVATE';
  rules: string[];
  judgingCriteria: string[];
  featuredImage?: string | null;
  attachments?: { url: string; name: string; type: string }[];
}

export interface SubmitEntryPayload {
  description: string;
  imageUrls?: string[];
  pdfUrl?: string | null;
  zipUrl?: string | null;
  githubUrl?: string | null;
  liveUrl?: string | null;
  figmaUrl?: string | null;
  videoUrl?: string | null;
}

export const contestService = {
  browse: async (filters?: ContestFilters): Promise<PaginatedContests> => {
    const response = await api.get('/contests', { params: filters });
    const data = response.data?.data ?? response.data;
    return {
      data: Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []),
      meta: data?.meta ?? { total: 0, page: 1, limit: 10, totalPages: 0 },
    };
  },

  getBySlug: async (slug: string): Promise<Contest> => {
    const response = await api.get(`/contests/${slug}`);
    return response.data?.data ?? response.data;
  },

  create: async (payload: CreateContestPayload): Promise<Contest> => {
    const response = await api.post('/contests', payload);
    return response.data?.data ?? response.data;
  },

  update: async (id: string, payload: Partial<CreateContestPayload>): Promise<Contest> => {
    const response = await api.put(`/contests/${id}`, payload);
    return response.data?.data ?? response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/contests/${id}`);
  },

  publish: async (id: string): Promise<Contest> => {
    const response = await api.post(`/contests/${id}/publish`);
    return response.data?.data ?? response.data;
  },

  pause: async (id: string): Promise<Contest> => {
    const response = await api.post(`/contests/${id}/pause`);
    return response.data?.data ?? response.data;
  },

  close: async (id: string): Promise<Contest> => {
    const response = await api.post(`/contests/${id}/close`);
    return response.data?.data ?? response.data;
  },

  reopen: async (id: string): Promise<Contest> => {
    const response = await api.post(`/contests/${id}/reopen`);
    return response.data?.data ?? response.data;
  },

  duplicate: async (id: string): Promise<Contest> => {
    const response = await api.post(`/contests/${id}/duplicate`);
    return response.data?.data ?? response.data;
  },

  join: async (id: string): Promise<ContestParticipant> => {
    const response = await api.post(`/contests/${id}/join`);
    return response.data?.data ?? response.data;
  },

  leave: async (id: string): Promise<void> => {
    await api.delete(`/contests/${id}/leave`);
  },

  listParticipants: async (id: string): Promise<ContestParticipant[]> => {
    const response = await api.get(`/contests/${id}/participants`);
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  },

  submit: async (id: string, payload: SubmitEntryPayload): Promise<ContestSubmission> => {
    const response = await api.post(`/contests/${id}/submit`, payload);
    return response.data?.data ?? response.data;
  },

  updateSubmission: async (id: string, payload: Partial<SubmitEntryPayload>): Promise<ContestSubmission> => {
    const response = await api.put(`/contests/${id}/submission`, payload);
    return response.data?.data ?? response.data;
  },

  withdrawSubmission: async (id: string): Promise<void> => {
    await api.delete(`/contests/${id}/submission`);
  },

  getMySubmission: async (id: string): Promise<{ isParticipant: boolean; submission: ContestSubmission | null }> => {
    const response = await api.get(`/contests/${id}/my-submission`);
    return response.data?.data ?? response.data;
  },

  listSubmissions: async (id: string, filter?: string): Promise<ContestSubmission[]> => {
    const response = await api.get(`/contests/${id}/submissions`, { params: filter ? { filter } : {} });
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  },

  updateSubmissionStatus: async (
    contestId: string,
    submissionId: string,
    status: string
  ): Promise<ContestSubmission> => {
    const response = await api.patch(`/contests/${contestId}/submissions/${submissionId}/status`, { status });
    return response.data?.data ?? response.data;
  },

  selectWinner: async (id: string, winnerId: string, runnerUpId?: string | null): Promise<Contest> => {
    const response = await api.post(`/contests/${id}/winner`, { winnerId, runnerUpId });
    return response.data?.data ?? response.data;
  },

  getClientContests: async (status?: string): Promise<Contest[]> => {
    const response = await api.get('/contests/client/me', { params: status ? { status } : {} });
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  },

  getAnalytics: async (id: string): Promise<ContestAnalytics> => {
    const response = await api.get(`/contests/${id}/analytics`);
    return response.data?.data ?? response.data;
  },

  getJoinedContests: async (): Promise<Contest[]> => {
    const response = await api.get('/contests/freelancer/joined');
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  },

  getSavedContests: async (): Promise<Contest[]> => {
    const response = await api.get('/contests/freelancer/saved');
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  },

  toggleSave: async (id: string): Promise<{ saved: boolean }> => {
    const response = await api.post(`/contests/${id}/save`);
    return response.data?.data ?? response.data;
  },

  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.fileUrl || response.data?.url || '';
  },
};
