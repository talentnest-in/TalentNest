import { api } from '@/lib/api';
import type { Job, JobStatus, JobsResponse, JobsQueryParams } from '@/types';

export interface JobInput {
  title: string;
  description: string;
  type: 'FIXED' | 'HOURLY';
  budget: number | null;
  status: JobStatus;
  location: string | null;
  isRemote: boolean;
  skills: string[];
}

// ── Freelancer Marketplace ──────────────────────────────────────────────────
// Fetches all OPEN jobs across all clients for freelancers to browse
export const jobService = {
  getOpenJobs: async (params?: JobsQueryParams): Promise<JobsResponse> => {
    const res = await api.get('/jobs', { params });
    return res.data;
  },

  getJob: async (id: string): Promise<Job> => {
    const res = await api.get(`/jobs/${id}`);
    return res.data.job;
  },
};

// ── Client Job Management ───────────────────────────────────────────────────
// Only for authenticated Clients managing their own job postings
export const clientJobService = {
  getMyJobs: async (params?: { status?: string; search?: string }): Promise<Job[]> => {
    const res = await api.get('/client/jobs', { params });
    return res.data.jobs;
  },

  getJob: async (id: string): Promise<Job> => {
    const res = await api.get(`/client/jobs/${id}`);
    return res.data.job;
  },

  createJob: async (data: JobInput): Promise<Job> => {
    const res = await api.post('/client/jobs', data);
    return res.data.job;
  },

  updateJob: async (id: string, data: JobInput): Promise<Job> => {
    const res = await api.put(`/client/jobs/${id}`, data);
    return res.data.job;
  },

  deleteJob: async (id: string): Promise<void> => {
    await api.delete(`/client/jobs/${id}`);
  },
};
