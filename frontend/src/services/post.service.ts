import { api } from '@/lib/api';
import type { Post, PostComment } from '@/types';
import type { PaginatedResponse } from './community.service';

export const postService = {
  getPosts: async (params?: { page?: number; limit?: number; filter?: 'newest' | 'popular' }): Promise<PaginatedResponse<Post>> => {
    const response = await api.get('/posts', { params });
    return response.data;
  },

  getCommunityPosts: async (communityId: string, params?: { page?: number; limit?: number; filter?: 'newest' | 'popular' }): Promise<PaginatedResponse<Post>> => {
    const response = await api.get(`/community/${communityId}/posts`, { params });
    return response.data;
  },

  createPost: async (data: { content: string; type?: 'TEXT' | 'IMAGE' | 'PDF' | 'LINK'; mediaUrls?: string[]; linkUrl?: string; communityId?: string }): Promise<Post> => {
    const response = await api.post('/posts', data);
    return response.data.data;
  },

  getPostById: async (id: string): Promise<Post> => {
    const response = await api.get(`/posts/${id}`);
    return response.data.data;
  },

  updatePost: async (id: string, data: Partial<Post>): Promise<Post> => {
    const response = await api.put(`/posts/${id}`, data);
    return response.data.data;
  },

  deletePost: async (id: string): Promise<void> => {
    await api.delete(`/posts/${id}`);
  },

  toggleLike: async (id: string): Promise<{ liked: boolean; likeCount: number }> => {
    const response = await api.post(`/posts/${id}/like`);
    return response.data.data;
  },

  addComment: async (id: string, data: { content: string; parentId?: string }): Promise<PostComment> => {
    const response = await api.post(`/posts/${id}/comments`, data);
    return response.data.data;
  },

  deleteComment: async (id: string, commentId: string): Promise<void> => {
    await api.delete(`/posts/${id}/comments/${commentId}`);
  },

  reportPost: async (id: string, reason: string): Promise<void> => {
    await api.post(`/posts/${id}/report`, { reason });
  },

  pinPost: async (id: string): Promise<void> => {
    await api.patch(`/posts/${id}/pin`);
  },

  hidePost: async (id: string): Promise<void> => {
    await api.patch(`/posts/${id}/hide`);
  },

  uploadMedia: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.url;
  },
};
