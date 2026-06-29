import axios from 'axios';
import { BACKEND_URL } from '@/lib/constants';

const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
});

export const uploadService = {
  async uploadChatFile(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/v1/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};
