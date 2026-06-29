import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createNotification } from './notification.controller';

// ── Validation Schemas ───────────────────────────────────────────────────────
const sendMessageSchema = z.object({
  content: z.string().optional(),
  type: z.enum(['TEXT', 'ATTACHMENT']).default('TEXT'),
  attachments: z.array(z.object({
    fileName: z.string(),
    fileUrl: z.string(),
    mimeType: z.string(),
    size: z.number(),
  })).optional(),
}).refine(data => data.content || (data.attachments && data.attachments.length > 0), {
  message: 'Either content or attachments must be provided',
});

// ── Get User's Conversations ─────────────────────────────────────────────────
export const getConversations = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = request.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { clientId: userId },
          { freelancerId: userId },
        ],
      },
      include: {
        contract: {
          include: {
            job: true,
          },
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
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return reply.send(conversations);
  } catch (error) {
    request.log.error(error, 'getConversations failed');
    return reply.status(500).send({ error: 'Failed to fetch conversations' });
  }
};

// ── Get Conversation Messages ───────────────────────────────────────────────
export const getMessages = async (request: FastifyRequest<{ Params: { conversationId: string } }>, reply: FastifyReply) => {
  try {
    const userId = request.user.id;
    const { conversationId } = request.params;

    // Verify user belongs to this conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return reply.status(404).send({ error: 'Conversation not found' });
    }

    if (conversation.clientId !== userId && conversation.freelancerId !== userId) {
      return reply.status(403).send({ error: 'Unauthorized access to conversation' });
    }

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
      orderBy: {
        createdAt: 'asc',
      },
    });

    return reply.send(messages);
  } catch (error) {
    request.log.error(error, 'getMessages failed');
    return reply.status(500).send({ error: 'Failed to fetch messages' });
  }
};

// ── Send Message ───────────────────────────────────────────────────────────
export const sendMessage = async (
  request: FastifyRequest<{
    Params: { conversationId: string };
    Body: { content?: string; type?: 'TEXT' | 'ATTACHMENT'; attachments?: any[] };
  }>,
  reply: FastifyReply
) => {
  try {
    const userId = request.user.id;
    const { conversationId } = request.params;
    const { content, type, attachments } = sendMessageSchema.parse(request.body);

    // Verify user belongs to this conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return reply.status(404).send({ error: 'Conversation not found' });
    }

    if (conversation.clientId !== userId && conversation.freelancerId !== userId) {
      return reply.status(403).send({ error: 'Unauthorized access to conversation' });
    }

    // Create message
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

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const recipientId = conversation.clientId === userId ? conversation.freelancerId : conversation.clientId;
    
    // Notify recipient of new message
    await createNotification({
      userId: recipientId,
      type: 'NEW_MESSAGE',
      title: 'New Message',
      message: `You received a new message from ${message.sender.name || 'someone'}`,
      link: `/client/workspace/${conversation.contractId}`,
    });

    return reply.status(201).send(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ error: error.issues[0]?.message || 'Validation error' });
    }
    request.log.error(error, 'sendMessage failed');
    return reply.status(500).send({ error: 'Failed to send message' });
  }
};

// ── Mark Messages as Read ───────────────────────────────────────────────────
export const markAsRead = async (request: FastifyRequest<{ Params: { conversationId: string } }>, reply: FastifyReply) => {
  try {
    const userId = request.user.id;
    const { conversationId } = request.params;

    // Verify user belongs to this conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return reply.status(404).send({ error: 'Conversation not found' });
    }

    if (conversation.clientId !== userId && conversation.freelancerId !== userId) {
      return reply.status(403).send({ error: 'Unauthorized access to conversation' });
    }

    // Mark all messages from other users as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    return reply.send({ success: true });
  } catch (error) {
    request.log.error(error, 'markAsRead failed');
    return reply.status(500).send({ error: 'Failed to mark messages as read' });
  }
};

// ── Get or Create Conversation ──────────────────────────────────────────────
export const getOrCreateConversation = async (
  request: FastifyRequest<{ Params: { contractId: string } }>,
  reply: FastifyReply
) => {
  try {
    const userId = request.user.id;
    const { contractId } = request.params;

    // Verify user belongs to this contract
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return reply.status(404).send({ error: 'Contract not found' });
    }

    if (contract.clientId !== userId && contract.freelancerId !== userId) {
      return reply.status(403).send({ error: 'Unauthorized access to contract' });
    }

    // Try to find existing conversation
    let conversation = await prisma.conversation.findUnique({
      where: { contractId },
      include: {
        contract: {
          include: {
            job: true,
          },
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

    // Create conversation if it doesn't exist
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          contractId,
          clientId: contract.clientId,
          freelancerId: contract.freelancerId,
        },
        include: {
          contract: {
            include: {
              job: true,
            },
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

    return reply.send(conversation);
  } catch (error) {
    request.log.error(error, 'getOrCreateConversation failed');
    return reply.status(500).send({ error: 'Failed to get or create conversation' });
  }
};
