import axios from 'axios';
import { BACKEND_URL } from '@/lib/constants';
import type { Conversation } from './chat.service';

const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
});

export const conversationService = {
  async getOrCreateConversation(contractId: string): Promise<Conversation> {
    const response = await api.get(`/api/v1/chat/contracts/${contractId}/conversation`);
    return response.data;
  },
};
