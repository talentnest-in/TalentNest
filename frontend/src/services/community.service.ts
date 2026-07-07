import { api } from '@/lib/api';
import type { Community, CommunityMember, SearchResult } from '@/types';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const communityService = {
  getCommunities: async (params?: { page?: number; limit?: number; sort?: 'newest' | 'popular' }): Promise<PaginatedResponse<Community>> => {
    const response = await api.get('/community', { params });
    return response.data;
  },

  createCommunity: async (data: { name: string; description?: string; type?: 'PUBLIC' | 'PRIVATE' }): Promise<Community> => {
    const response = await api.post('/community', data);
    return response.data.data;
  },

  getCommunityBySlug: async (slug: string): Promise<Community> => {
    const response = await api.get(`/community/${slug}`);
    return response.data;
  },

  updateCommunity: async (id: string, data: Partial<Community>): Promise<Community> => {
    const response = await api.put(`/community/${id}`, data);
    return response.data.data;
  },

  deleteCommunity: async (id: string): Promise<void> => {
    await api.delete(`/community/${id}`);
  },

  joinCommunity: async (id: string): Promise<void> => {
    await api.post(`/community/${id}/join`);
  },

  leaveCommunity: async (id: string): Promise<void> => {
    await api.delete(`/community/${id}/leave`);
  },

  getCommunityMembers: async (id: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<CommunityMember>> => {
    const response = await api.get(`/community/${id}/members`, { params });
    return response.data;
  },

  promoteMember: async (communityId: string, userId: string, role: 'ADMIN' | 'MEMBER'): Promise<void> => {
    await api.patch(`/community/${communityId}/members/${userId}/role`, { role });
  },

  search: async (q: string): Promise<SearchResult> => {
    const response = await api.get('/community/search', { params: { q } });
    return response.data.data;
  },
};
