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
    const result = response.data?.data ?? response.data;
    if (result && typeof result === 'object' && !Array.isArray(result) && !result.data) {
      return { data: Array.isArray(result) ? result : [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    }
    if (result && typeof result === 'object' && !Array.isArray(result) && result.data) {
      return result;
    }
    return { data: Array.isArray(result) ? result : [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
  },

  createCommunity: async (data: { name: string; description?: string; type?: 'PUBLIC' | 'PRIVATE' }): Promise<Community> => {
    const response = await api.post('/community', data);
    return response.data?.data ?? response.data;
  },

  getCommunityBySlug: async (slug: string): Promise<Community> => {
    const response = await api.get(`/community/${slug}`);
    return response.data?.data ?? response.data;
  },

  updateCommunity: async (id: string, data: Partial<Community>): Promise<Community> => {
    const response = await api.put(`/community/${id}`, data);
    return response.data?.data ?? response.data;
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
    const result = response.data?.data ?? response.data;
    if (result && typeof result === 'object' && !Array.isArray(result) && result.data) {
      return result;
    }
    return { data: Array.isArray(result) ? result : [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
  },

  promoteMember: async (communityId: string, userId: string, role: 'ADMIN' | 'MEMBER'): Promise<void> => {
    await api.patch(`/community/${communityId}/members/${userId}/role`, { role });
  },

  search: async (q: string): Promise<SearchResult> => {
    const response = await api.get('/community/search', { params: { q } });
    const result = response.data?.data ?? response.data;
    return {
      communities: Array.isArray(result?.communities) ? result.communities : [],
      posts: Array.isArray(result?.posts) ? result.posts : [],
      users: Array.isArray(result?.users) ? result.users : [],
      jobs: Array.isArray(result?.jobs) ? result.jobs : [],
      contests: Array.isArray(result?.contests) ? result.contests : [],
    };
  },
};
