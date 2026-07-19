import { api } from '@/lib/api';

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
  publicId: string;
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

export const chatService = {
  async getConversations(page = 1, limit = 20): Promise<Conversation[]> {
    const response = await api.get('/chat/conversations', { params: { page, limit } });
    const data = response.data?.data ?? response.data;
    const items = data?.conversations ?? data;
    return Array.isArray(items) ? items : [];
  },

  async getMessages(conversationId: string, cursor?: string, limit?: string): Promise<Message[]> {
    const response = await api.get(`/chat/conversations/${conversationId}/messages`, { params: { cursor, limit } });
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : [];
  },

  async sendMessage(
    conversationId: string,
    content?: string,
    attachments?: MessageAttachment[]
  ): Promise<Message> {
    const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
      content,
      type: attachments && attachments.length > 0 ? 'ATTACHMENT' : 'TEXT',
      attachments,
    });
    return response.data?.data ?? response.data;
  },

  async uploadFile(file: File): Promise<{
    fileName: string;
    fileUrl: string;
    publicId: string;
    mimeType: string;
    size: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.data ?? response.data;
  },

  async markAsRead(conversationId: string): Promise<void> {
    await api.patch(`/chat/conversations/${conversationId}/read`);
  },

  async getOrCreateConversation(contractId: string): Promise<Conversation> {
    const response = await api.get(`/chat/contracts/${contractId}/conversation`);
    return response.data?.data ?? response.data;
  },
};
