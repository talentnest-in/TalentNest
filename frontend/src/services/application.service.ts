import { api } from '@/lib/api';
import type { ApplyJobInput, ApplicationWithDetails, ApplicationsQueryParams, ApplicationsResponse, JobApplication } from '@/types';

export const applicationService = {
  // Apply for a job
  applyForJob: async (jobId: string, data: ApplyJobInput): Promise<{ application: JobApplication }> => {
    const res = await api.post(`/jobs/${jobId}/apply`, data);
    return res.data;
  },

  // Get my applications
  getMyApplications: async (params?: ApplicationsQueryParams): Promise<ApplicationsResponse> => {
    const res = await api.get('/freelancers/applications', { params });
    return res.data;
  },

  // Get application details
  getApplicationDetails: async (id: string): Promise<{ application: ApplicationWithDetails }> => {
    const res = await api.get(`/freelancers/applications/${id}`);
    return res.data;
  },

  // Withdraw application
  withdrawApplication: async (id: string): Promise<{ message: string }> => {
    const res = await api.put(`/freelancers/applications/${id}/withdraw`);
    return res.data;
  },
};
