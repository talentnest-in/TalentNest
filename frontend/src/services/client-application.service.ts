import { api } from '@/lib/api';
import type { ApplicationsQueryParams, ApplicationsResponse, ApplicationWithDetails, UpdateStatusInput } from '@/types';

export const clientApplicationService = {
  getAllApplicants: async (params?: ApplicationsQueryParams): Promise<ApplicationsResponse> => {
    const res = await api.get('/client/applications', { params });
    const data = res.data?.data ?? res.data;
    return {
      applications: Array.isArray(data?.applications) ? data.applications : [],
      total: data?.total ?? 0,
      page: data?.page ?? 1,
      totalPages: data?.totalPages ?? 0,
    };
  },

  getJobApplicants: async (jobId: string, params?: ApplicationsQueryParams): Promise<ApplicationsResponse> => {
    const res = await api.get(`/client/jobs/${jobId}/applications`, { params });
    const data = res.data?.data ?? res.data;
    return {
      applications: Array.isArray(data?.applications) ? data.applications : [],
      total: data?.total ?? 0,
      page: data?.page ?? 1,
      totalPages: data?.totalPages ?? 0,
    };
  },

  getApplicantDetails: async (id: string): Promise<{ application: ApplicationWithDetails }> => {
    const res = await api.get(`/client/applications/${id}`);
    return res.data?.data ?? res.data;
  },

  updateApplicationStatus: async (id: string, data: UpdateStatusInput): Promise<{ application: ApplicationWithDetails }> => {
    const res = await api.patch(`/client/applications/${id}/status`, data);
    return res.data?.data ?? res.data;
  },
};
