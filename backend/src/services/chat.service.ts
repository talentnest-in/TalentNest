import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { NotFoundError, ForbiddenError } from '../lib/errors';
import { createNotification } from './notification.service';

// ── Validation Schemas ──
const sendMessageSchema = z.object({
  content: z.string().optional(),
  type: z.enum(['TEXT', 'ATTACHMENT']).default('TEXT'),
  attachments: z.array(z.object({
    fileName: z.string(),
    fileUrl: z.string(),
    publicId: z.string(),
    mimeType: z.string(),
    size: z.number(),
  })).optional(),
}).refine(data => data.content || (data.attachments && data.attachments.length > 0), {
  message: 'Either content or attachments must be provided',
});

export async function getConversations(
  userId: string,
  query: { page?: string; limit?: string }
) {
  const page = Math.max(1, parseInt(query.page || '1'));
  const limit = Math.min(50, parseInt(query.limit || '20'));
  const skip = (page - 1) * limit;

  const where = {
    OR: [
      { clientId: userId },
      { freelancerId: userId },
    ],
  };

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      include: {
        contract: {
          include: { job: true },
        },
        client: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        freelancer: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.conversation.count({ where }),
  ]);

  return { conversations, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getMessages(
  userId: string,
  conversationId: string,
  query: { cursor?: string; limit?: string }
) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new NotFoundError('Conversation');
  }

  if (conversation.clientId !== userId && conversation.freelancerId !== userId) {
    throw new ForbiddenError('Unauthorized access to conversation');
  }

  const { cursor, limit = '50' } = query;
  const take = Math.min(parseInt(limit), 100);

  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      attachments: true,
    },
    orderBy: { createdAt: 'desc' },
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  messages.reverse();

  return messages;
}

export async function sendMessage(
  userId: string,
  conversationId: string,
  body: unknown
) {
  const { content, type, attachments } = sendMessageSchema.parse(body);

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new NotFoundError('Conversation');
  }

  if (conversation.clientId !== userId && conversation.freelancerId !== userId) {
    throw new ForbiddenError('Unauthorized access to conversation');
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      content: content || null,
      type: type || 'TEXT',
      ...(attachments && attachments.length > 0 ? {
        attachments: {
          create: attachments.map(att => ({
            fileName: att.fileName,
            fileUrl: att.fileUrl,
            publicId: att.publicId,
            mimeType: att.mimeType,
            size: att.size,
          })),
        },
      } : {}),
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      attachments: true,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  const recipientId = conversation.clientId === userId ? conversation.freelancerId : conversation.clientId;

  await createNotification({
    userId: recipientId,
    type: 'NEW_MESSAGE',
    title: 'New Message',
    message: `You received a new message from ${message.sender.name || 'someone'}`,
    link: `/client/workspace/${conversation.contractId}`,
  });

  return message;
}

export async function markAsRead(userId: string, conversationId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new NotFoundError('Conversation');
  }

  if (conversation.clientId !== userId && conversation.freelancerId !== userId) {
    throw new ForbiddenError('Unauthorized access to conversation');
  }

  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      isRead: false,
    },
    data: { isRead: true },
  });

  return { success: true };
}

export async function getOrCreateConversation(userId: string, contractId: string) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });

  if (!contract) {
    throw new NotFoundError('Contract');
  }

  if (contract.clientId !== userId && contract.freelancerId !== userId) {
    throw new ForbiddenError('Unauthorized access to contract');
  }

  let conversation = await prisma.conversation.findUnique({
    where: { contractId },
    include: {
      contract: {
        include: { job: true },
      },
      client: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        contractId,
        clientId: contract.clientId,
        freelancerId: contract.freelancerId,
      },
      include: {
        contract: {
          include: { job: true },
        },
        client: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        freelancer: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  return conversation;
}
