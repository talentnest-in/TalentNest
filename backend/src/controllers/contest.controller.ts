import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import {
  browseContests as svcBrowseContests, createContest as svcCreateContest, getContestDetail as svcGetContestDetail,
  updateContest as svcUpdateContest, deleteContest as svcDeleteContest, publishContest as svcPublishContest,
  pauseContest as svcPauseContest, closeContest as svcCloseContest, reopenContest as svcReopenContest,
  duplicateContest as svcDuplicateContest, joinContest as svcJoinContest, leaveContest as svcLeaveContest,
  listParticipants as svcListParticipants, submitEntry as svcSubmitEntry, updateSubmission as svcUpdateSubmission,
  withdrawSubmission as svcWithdrawSubmission, listSubmissions as svcListSubmissions, getMySubmission as svcGetMySubmission,
  updateSubmissionStatus as svcUpdateSubmissionStatus, selectWinner as svcSelectWinner,
  getClientContests as svcGetClientContests, getContestAnalytics as svcGetContestAnalytics,
  getFreelancerJoinedContests as svcGetFreelancerJoinedContests, getFreelancerSavedContests as svcGetFreelancerSavedContests,
  toggleSaveContest as svcToggleSaveContest,
} from '../services/contest.service';
import { AppError } from '../lib/errors';

const uuidSchema = z.string().uuid('Invalid ID format');
const contestSubmissionSchema = z.object({ id: z.string().uuid('Invalid contest ID'), submissionId: z.string().uuid('Invalid submission ID') });

const contestController = {
  async browseContests(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await svcBrowseContests(request.query as any);
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'browseContests failed');
      return reply.status(500).send({ error: 'Failed to fetch contests' });
    }
  },

  async createContest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const userRole = (request as any).user.role;
      const result = await svcCreateContest(userId, userRole, request.body);
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'createContest failed');
      return reply.status(500).send({ error: 'Failed to create contest' });
    }
  },

  async getContestDetail(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { slug } = request.params as { slug: string };
      const result = await svcGetContestDetail(slug);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'getContestDetail failed');
      return reply.status(500).send({ error: 'Failed to fetch contest' });
    }
  },

  async updateContest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const parsedId = uuidSchema.parse(id);
      const result = await svcUpdateContest(parsedId, userId, request.body);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contest ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'updateContest failed');
      return reply.status(500).send({ error: 'Failed to update contest' });
    }
  },

  async deleteContest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const userRole = (request as any).user.role;
      const { id } = request.params as { id: string };
      const parsedId = uuidSchema.parse(id);
      await svcDeleteContest(parsedId, userId, userRole);
      return reply.send({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contest ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'deleteContest failed');
      return reply.status(500).send({ error: 'Failed to delete contest' });
    }
  },

  async publishContest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const parsedId = uuidSchema.parse(id);
      const result = await svcPublishContest(parsedId, userId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contest ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to publish contest' });
    }
  },

  async pauseContest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const parsedId = uuidSchema.parse(id);
      const result = await svcPauseContest(parsedId, userId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contest ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to pause contest' });
    }
  },

  async closeContest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const parsedId = uuidSchema.parse(id);
      const result = await svcCloseContest(parsedId, userId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contest ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to close contest' });
    }
  },

  async reopenContest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const parsedId = uuidSchema.parse(id);
      const result = await svcReopenContest(parsedId, userId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contest ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to reopen contest' });
    }
  },

  async duplicateContest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const parsedId = uuidSchema.parse(id);
      const result = await svcDuplicateContest(parsedId, userId);
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contest ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to duplicate contest' });
    }
  },

  async joinContest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const userRole = (request as any).user.role;
      const { id } = request.params as { id: string };
      const parsedId = uuidSchema.parse(id);
      const result = await svcJoinContest(parsedId, { id: userId, role: userRole });
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contest ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to join contest' });
    }
  },

  async leaveContest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const parsedId = uuidSchema.parse(id);
      const result = await svcLeaveContest(parsedId, userId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contest ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to leave contest' });
    }
  },

  async listParticipants(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const parsedId = uuidSchema.parse(id);
      const result = await svcListParticipants(parsedId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contest ID format' });
      request.log.error(error, 'listParticipants failed');
      return reply.status(500).send({ error: 'Failed to fetch participants' });
    }
  },

  async submitEntry(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const parsedId = uuidSchema.parse(id);
      const result = await svcSubmitEntry(parsedId, userId, request.body);
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contest ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to submit entry' });
    }
  },

  async updateSubmission(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const parsedId = uuidSchema.parse(id);
      const result = await svcUpdateSubmission(parsedId, userId, request.body);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid submission ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to update submission' });
    }
  },

  async withdrawSubmission(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const parsedId = uuidSchema.parse(id);
      await svcWithdrawSubmission(parsedId, userId);
      return reply.send({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid submission ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to withdraw submission' });
    }
  },

  async listSubmissions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const parsedId = uuidSchema.parse(id);
      const user = (request as any).user;
      const { filter } = request.query as { filter?: string };
      const result = await svcListSubmissions(parsedId, user.id, user.role, filter);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contest ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to list submissions' });
    }
  },

  async getMySubmission(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const parsedId = uuidSchema.parse(id);
      const result = await svcGetMySubmission(parsedId, userId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contest ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to fetch submission' });
    }
  },

  async updateSubmissionStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id, submissionId } = contestSubmissionSchema.parse(request.params);
      const { status } = request.body as { status: any };
      const result = await svcUpdateSubmissionStatus(id, submissionId, userId, status);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contest or submission ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to update submission status' });
    }
  },

  async selectWinner(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const parsedId = uuidSchema.parse(id);
      const result = await svcSelectWinner(parsedId, userId, request.body);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contest ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to select winner' });
    }
  },

  async getClientContests(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const result = await svcGetClientContests(userId, request.query as any);
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'getClientContests failed');
      return reply.status(500).send({ error: 'Failed to fetch contests' });
    }
  },

  async getContestAnalytics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const parsedId = uuidSchema.parse(id);
      const result = await svcGetContestAnalytics(parsedId, userId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contest ID format' });
      request.log.error(error, 'getContestAnalytics failed');
      return reply.status(500).send({ error: 'Failed to fetch analytics' });
    }
  },

  async getFreelancerJoinedContests(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const result = await svcGetFreelancerJoinedContests(userId);
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'getFreelancerJoinedContests failed');
      return reply.status(500).send({ error: 'Failed to fetch contests' });
    }
  },

  async getFreelancerSavedContests(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const result = await svcGetFreelancerSavedContests(userId);
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'getFreelancerSavedContests failed');
      return reply.status(500).send({ error: 'Failed to fetch saved contests' });
    }
  },

  async toggleSaveContest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const parsedId = uuidSchema.parse(id);
      const result = await svcToggleSaveContest(userId, parsedId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Invalid contest ID format' });
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to toggle save' });
    }
  },
};

export const {
  browseContests, createContest, getContestDetail, updateContest, deleteContest,
  publishContest, pauseContest, closeContest, reopenContest, duplicateContest,
  joinContest, leaveContest, listParticipants, submitEntry, updateSubmission,
  withdrawSubmission, listSubmissions, getMySubmission, updateSubmissionStatus,
  selectWinner, getClientContests, getContestAnalytics, getFreelancerJoinedContests,
  getFreelancerSavedContests, toggleSaveContest,
} = contestController;

export const updateSubmissionStatusById = contestController.updateSubmissionStatus;
