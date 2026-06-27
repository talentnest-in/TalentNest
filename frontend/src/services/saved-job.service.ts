import { api } from '@/lib/api';
import type { SavedJob } from '@/types';

export const savedJobService = {
  saveJob: async (jobId: string): Promise<{ savedJob: SavedJob }> => {
    const response = await api.post(`/jobs/${jobId}/save`);
    return response.data;
  },

  removeSavedJob: async (jobId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/jobs/${jobId}/save`);
    return response.data;
  },

  getSavedJobs: async (): Promise<{ savedJobs: SavedJob[] }> => {
    const response = await api.get('/freelancers/saved-jobs');
    return response.data;
  },
};
