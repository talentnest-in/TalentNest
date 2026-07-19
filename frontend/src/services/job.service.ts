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

export const jobService = {
  getOpenJobs: async (params?: JobsQueryParams): Promise<JobsResponse> => {
    const res = await api.get('/jobs', { params });
    const data = res.data?.data ?? res.data;
    return data;
  },

  getJob: async (id: string): Promise<Job> => {
    const res = await api.get(`/jobs/${id}`);
    const data = res.data?.data ?? res.data;
    return data?.job ?? data;
  },

  getRecommendedJobs: async (limit = 6): Promise<{ jobs: Job[]; matched: boolean }> => {
    const res = await api.get('/jobs/recommended', { params: { limit } });
    const data = res.data?.data ?? res.data;
    return {
      jobs: Array.isArray(data?.jobs) ? data.jobs : [],
      matched: data?.matched ?? false,
    };
  },
};

export const clientJobService = {
  getMyJobs: async (params?: { status?: string; search?: string }): Promise<Job[]> => {
    const res = await api.get('/client/jobs', { params });
    const data = res.data?.data ?? res.data;
    return Array.isArray(data?.jobs) ? data.jobs : [];
  },

  getJob: async (id: string): Promise<Job> => {
    const res = await api.get(`/client/jobs/${id}`);
    const data = res.data?.data ?? res.data;
    return data?.job ?? data;
  },

  createJob: async (params: JobInput): Promise<Job> => {
    const res = await api.post('/client/jobs', params);
    const data = res.data?.data ?? res.data;
    return data?.job ?? data;
  },

  updateJob: async (id: string, params: JobInput): Promise<Job> => {
    const res = await api.put(`/client/jobs/${id}`, params);
    const data = res.data?.data ?? res.data;
    return data?.job ?? data;
  },

  deleteJob: async (id: string): Promise<void> => {
    await api.delete(`/client/jobs/${id}`);
  },
};
