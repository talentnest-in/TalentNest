import { api } from '@/lib/api';
import type { Conversation } from './chat.service';

export const conversationService = {
  async getOrCreateConversation(contractId: string): Promise<Conversation> {
    const response = await api.get(`/chat/contracts/${contractId}/conversation`);
    return response.data?.data ?? response.data;
  },
};
