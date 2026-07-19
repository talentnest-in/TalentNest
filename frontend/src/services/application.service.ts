import { api } from '@/lib/api';
import type { ApplyJobInput, ApplicationWithDetails, ApplicationsQueryParams, ApplicationsResponse, JobApplication } from '@/types';

export const applicationService = {
  applyForJob: async (jobId: string, data: ApplyJobInput): Promise<{ application: JobApplication }> => {
    const res = await api.post(`/jobs/${jobId}/apply`, data);
    return res.data?.data ?? res.data;
  },

  getMyApplications: async (params?: ApplicationsQueryParams): Promise<ApplicationsResponse> => {
    const res = await api.get('/freelancers/applications', { params });
    const data = res.data?.data ?? res.data;
    return {
      applications: Array.isArray(data?.applications) ? data.applications : [],
      total: data?.total ?? 0,
      page: data?.page ?? 1,
      totalPages: data?.totalPages ?? 0,
    };
  },

  getApplicationDetails: async (id: string): Promise<{ application: ApplicationWithDetails }> => {
    const res = await api.get(`/freelancers/applications/${id}`);
    return res.data?.data ?? res.data;
  },

  withdrawApplication: async (id: string): Promise<{ message: string }> => {
    const res = await api.put(`/freelancers/applications/${id}/withdraw`);
    return res.data?.data ?? res.data;
  },
};
