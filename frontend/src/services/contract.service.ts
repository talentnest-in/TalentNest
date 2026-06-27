import { api } from '@/lib/api';

export interface ContractsQueryParams {
  status?: string;
  page?: number;
  limit?: number;
}

export interface ContractsResponse {
  contracts: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const contractService = {
  // Get contracts (shared for client and freelancer)
  getContracts: async (params?: ContractsQueryParams) => {
    const response = await api.get('/contracts', { params });
    return response.data as ContractsResponse;
  },

  // Get contract details
  getContractDetails: async (id: string) => {
    const response = await api.get(`/contracts/${id}`);
    return response.data;
  },

  // Update contract status
  updateContractStatus: async (id: string, status: string) => {
    const response = await api.patch(`/contracts/${id}/status`, { status });
    return response.data;
  },
};
