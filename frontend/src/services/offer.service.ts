import { api } from '@/lib/api';

export interface CreateOfferInput {
  applicationId: string;
  title: string;
  message: string;
  proposedBudget: number;
  currency?: string;
  estimatedDuration?: string;
  deadline?: string;
}

export interface OffersQueryParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface OffersResponse {
  offers: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const offerService = {
  createOffer: async (data: CreateOfferInput) => {
    const response = await api.post('/offers', data);
    return response.data?.data ?? response.data;
  },

  getClientOffers: async (params?: OffersQueryParams) => {
    const response = await api.get('/offers/client', { params });
    const data = response.data?.data ?? response.data;
    return {
      offers: Array.isArray(data?.offers) ? data.offers : [],
      pagination: data?.pagination ?? { page: 1, limit: 10, total: 0, pages: 0 },
    } as OffersResponse;
  },

  getOfferDetails: async (id: string) => {
    const response = await api.get(`/offers/${id}`);
    return response.data?.data ?? response.data;
  },

  cancelOffer: async (id: string) => {
    const response = await api.patch(`/offers/client/${id}/cancel`);
    return response.data?.data ?? response.data;
  },

  getFreelancerOffers: async (params?: OffersQueryParams) => {
    const response = await api.get('/offers/freelancer', { params });
    const data = response.data?.data ?? response.data;
    return {
      offers: Array.isArray(data?.offers) ? data.offers : [],
      pagination: data?.pagination ?? { page: 1, limit: 10, total: 0, pages: 0 },
    } as OffersResponse;
  },

  acceptOffer: async (id: string) => {
    const response = await api.patch(`/offers/${id}/accept`);
    return response.data?.data ?? response.data;
  },

  declineOffer: async (id: string) => {
    const response = await api.patch(`/offers/${id}/decline`);
    return response.data?.data ?? response.data;
  },
};
