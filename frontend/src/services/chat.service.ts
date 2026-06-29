import axios from 'axios';
import { BACKEND_URL } from '@/lib/constants';

export interface Conversation {
  id: string;
  contractId: string;
  clientId: string;
  freelancerId: string;
  createdAt: string;
  updatedAt: string;
  contract: {
    id: string;
    title: string;
    job: {
      title: string;
    };
  };
  client: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  freelancer: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  messages: Message[];
  _count: {
    messages: number;
  };
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: 'TEXT' | 'ATTACHMENT';
  content: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  attachments: MessageAttachment[];
}

const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
});

export const chatService = {
  async getConversations(): Promise<Conversation[]> {
    const response = await api.get('/api/v1/chat/conversations');
    return response.data;
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await api.get(`/api/v1/chat/conversations/${conversationId}/messages`);
    return response.data;
  },

  async sendMessage(
    conversationId: string,
    content?: string,
    attachments?: MessageAttachment[]
  ): Promise<Message> {
    const response = await api.post(`/api/v1/chat/conversations/${conversationId}/messages`, {
      content,
      type: attachments && attachments.length > 0 ? 'ATTACHMENT' : 'TEXT',
      attachments,
    });
    return response.data;
  },

  async uploadFile(file: File): Promise<{
    fileName: string;
    fileUrl: string;
    mimeType: string;
    size: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/v1/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async markAsRead(conversationId: string): Promise<void> {
    await api.patch(`/api/v1/chat/conversations/${conversationId}/read`);
  },

  async getOrCreateConversation(contractId: string): Promise<Conversation> {
    const response = await api.get(`/api/v1/chat/contracts/${contractId}/conversation`);
    return response.data;
  },
};
