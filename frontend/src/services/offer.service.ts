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
  // Create offer (Client)
  createOffer: async (data: CreateOfferInput) => {
    const response = await api.post('/offers', data);
    return response.data;
  },

  // Get client's offers
  getClientOffers: async (params?: OffersQueryParams) => {
    const response = await api.get('/offers/client', { params });
    return response.data as OffersResponse;
  },

  // Get offer details
  getOfferDetails: async (id: string) => {
    const response = await api.get(`/offers/${id}`);
    return response.data;
  },

  // Cancel offer (Client)
  cancelOffer: async (id: string) => {
    const response = await api.patch(`/offers/client/${id}/cancel`);
    return response.data;
  },

  // Get freelancer's offers
  getFreelancerOffers: async (params?: OffersQueryParams) => {
    const response = await api.get('/offers/freelancer', { params });
    return response.data as OffersResponse;
  },

  // Accept offer (Freelancer)
  acceptOffer: async (id: string) => {
    const response = await api.patch(`/offers/${id}/accept`);
    return response.data;
  },

  // Decline offer (Freelancer)
  declineOffer: async (id: string) => {
    const response = await api.patch(`/offers/${id}/decline`);
    return response.data;
  },
};
