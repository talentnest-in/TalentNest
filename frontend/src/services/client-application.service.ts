import { api } from '@/lib/api';
import type { ApplicationsQueryParams, ApplicationsResponse, ApplicationWithDetails, UpdateStatusInput } from '@/types';

export const clientApplicationService = {
  // Get all applicants for client (across all jobs)
  getAllApplicants: async (params?: ApplicationsQueryParams): Promise<ApplicationsResponse> => {
    const res = await api.get('/client/applications', { params });
    return res.data;
  },

  // Get applicants for a job
  getJobApplicants: async (jobId: string, params?: ApplicationsQueryParams): Promise<ApplicationsResponse> => {
    const res = await api.get(`/client/jobs/${jobId}/applications`, { params });
    return res.data;
  },

  // Get applicant details
  getApplicantDetails: async (id: string): Promise<{ application: ApplicationWithDetails }> => {
    const res = await api.get(`/client/applications/${id}`);
    return res.data;
  },

  // Update application status
  updateApplicationStatus: async (id: string, data: UpdateStatusInput): Promise<{ application: ApplicationWithDetails }> => {
    const res = await api.patch(`/client/applications/${id}/status`, data);
    return res.data;
  },
};
