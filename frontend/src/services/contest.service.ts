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
  // ─── Public ────────────────────────────────────────────────────────────
  browse: async (filters?: ContestFilters): Promise<PaginatedContests> => {
    const response = await api.get('/contests', { params: filters });
    return response.data;
  },

  getBySlug: async (slug: string): Promise<Contest> => {
    const response = await api.get(`/contests/${slug}`);
    return response.data.data;
  },

  // ─── CRUD ──────────────────────────────────────────────────────────────
  create: async (payload: CreateContestPayload): Promise<Contest> => {
    const response = await api.post('/contests', payload);
    return response.data.data;
  },

  update: async (id: string, payload: Partial<CreateContestPayload>): Promise<Contest> => {
    const response = await api.put(`/contests/${id}`, payload);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/contests/${id}`);
  },

  // ─── Status ────────────────────────────────────────────────────────────
  publish: async (id: string): Promise<Contest> => {
    const response = await api.post(`/contests/${id}/publish`);
    return response.data.data;
  },

  pause: async (id: string): Promise<Contest> => {
    const response = await api.post(`/contests/${id}/pause`);
    return response.data.data;
  },

  close: async (id: string): Promise<Contest> => {
    const response = await api.post(`/contests/${id}/close`);
    return response.data.data;
  },

  reopen: async (id: string): Promise<Contest> => {
    const response = await api.post(`/contests/${id}/reopen`);
    return response.data.data;
  },

  duplicate: async (id: string): Promise<Contest> => {
    const response = await api.post(`/contests/${id}/duplicate`);
    return response.data.data;
  },

  // ─── Participation ─────────────────────────────────────────────────────
  join: async (id: string): Promise<ContestParticipant> => {
    const response = await api.post(`/contests/${id}/join`);
    return response.data.data;
  },

  leave: async (id: string): Promise<void> => {
    await api.delete(`/contests/${id}/leave`);
  },

  listParticipants: async (id: string): Promise<ContestParticipant[]> => {
    const response = await api.get(`/contests/${id}/participants`);
    return response.data.data;
  },

  // ─── Submissions ───────────────────────────────────────────────────────
  submit: async (id: string, payload: SubmitEntryPayload): Promise<ContestSubmission> => {
    const response = await api.post(`/contests/${id}/submit`, payload);
    return response.data.data;
  },

  updateSubmission: async (id: string, payload: Partial<SubmitEntryPayload>): Promise<ContestSubmission> => {
    const response = await api.put(`/contests/${id}/submission`, payload);
    return response.data.data;
  },

  withdrawSubmission: async (id: string): Promise<void> => {
    await api.delete(`/contests/${id}/submission`);
  },

  getMySubmission: async (id: string): Promise<{ isParticipant: boolean, submission: ContestSubmission | null }> => {
    const response = await api.get(`/contests/${id}/my-submission`);
    return response.data.data;
  },

  listSubmissions: async (id: string, filter?: string): Promise<ContestSubmission[]> => {
    const response = await api.get(`/contests/${id}/submissions`, { params: filter ? { filter } : {} });
    return response.data.data;
  },

  updateSubmissionStatus: async (
    contestId: string,
    submissionId: string,
    status: string
  ): Promise<ContestSubmission> => {
    const response = await api.patch(`/contests/${contestId}/submissions/${submissionId}/status`, { status });
    return response.data.data;
  },

  selectWinner: async (id: string, winnerId: string, runnerUpId?: string | null): Promise<Contest> => {
    const response = await api.post(`/contests/${id}/winner`, { winnerId, runnerUpId });
    return response.data.data;
  },

  // ─── Dashboards ────────────────────────────────────────────────────────
  getClientContests: async (status?: string): Promise<Contest[]> => {
    const response = await api.get('/contests/client/me', { params: status ? { status } : {} });
    return response.data.data;
  },

  getAnalytics: async (id: string): Promise<ContestAnalytics> => {
    const response = await api.get(`/contests/${id}/analytics`);
    return response.data.data;
  },

  getJoinedContests: async (): Promise<Contest[]> => {
    const response = await api.get('/contests/freelancer/joined');
    return response.data.data;
  },

  getSavedContests: async (): Promise<Contest[]> => {
    const response = await api.get('/contests/freelancer/saved');
    return response.data.data;
  },

  toggleSave: async (id: string): Promise<{ saved: boolean }> => {
    const response = await api.post(`/contests/${id}/save`);
    return response.data;
  },

  // ─── Media Upload ──────────────────────────────────────────────────────
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.fileUrl || response.data.url;
  },
};
