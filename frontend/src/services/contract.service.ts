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
  getContracts: async (params?: ContractsQueryParams) => {
    const response = await api.get('/contracts', { params });
    const data = response.data?.data ?? response.data;
    return {
      contracts: Array.isArray(data?.contracts) ? data.contracts : [],
      pagination: data?.pagination ?? { page: 1, limit: 10, total: 0, pages: 0 },
    } as ContractsResponse;
  },

  getContractDetails: async (id: string) => {
    const response = await api.get(`/contracts/${id}`);
    return response.data?.data ?? response.data;
  },

  updateContractStatus: async (id: string, status: string) => {
    const response = await api.patch(`/contracts/${id}/status`, { status });
    return response.data?.data ?? response.data;
  },
};
