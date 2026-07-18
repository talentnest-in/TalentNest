import { FastifyRequest, FastifyReply } from 'fastify';
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
      const result = await svcUpdateContest(userId, id, request.body);
      return reply.send(result);
    } catch (error) {
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
      await svcDeleteContest(id, userId, userRole);
      return reply.send({ success: true });
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'deleteContest failed');
      return reply.status(500).send({ error: 'Failed to delete contest' });
    }
  },

  async publishContest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const result = await svcPublishContest(userId, id);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to publish contest' });
    }
  },

  async pauseContest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const result = await svcPauseContest(userId, id);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to pause contest' });
    }
  },

  async closeContest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const result = await svcCloseContest(userId, id);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to close contest' });
    }
  },

  async reopenContest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const result = await svcReopenContest(userId, id);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to reopen contest' });
    }
  },

  async duplicateContest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const result = await svcDuplicateContest(userId, id);
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to duplicate contest' });
    }
  },

  async joinContest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const userRole = (request as any).user.role;
      const { id } = request.params as { id: string };
      const result = await svcJoinContest(id, { id: userId, role: userRole });
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to join contest' });
    }
  },

  async leaveContest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const result = await svcLeaveContest(userId, id);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to leave contest' });
    }
  },

  async listParticipants(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const result = await svcListParticipants(id);
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'listParticipants failed');
      return reply.status(500).send({ error: 'Failed to fetch participants' });
    }
  },

  async submitEntry(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const result = await svcSubmitEntry(userId, id, request.body);
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to submit entry' });
    }
  },

  async updateSubmission(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const result = await svcUpdateSubmission(id, userId, request.body);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to update submission' });
    }
  },

  async withdrawSubmission(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      await svcWithdrawSubmission(id, userId);
      return reply.send({ success: true });
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to withdraw submission' });
    }
  },

  async listSubmissions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const userId = (request as any).user.id;
      const result = await svcListSubmissions(userId, id, request.query as any);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to list submissions' });
    }
  },

  async getMySubmission(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const result = await svcGetMySubmission(userId, id);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to fetch submission' });
    }
  },

  async updateSubmissionStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id, submissionId } = request.params as { id: string; submissionId: string };
      const body = request.body as any;
      const result = await svcUpdateSubmissionStatus(userId, id, submissionId, body);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to update submission status' });
    }
  },

  async selectWinner(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id, submissionId } = request.params as { id: string; submissionId: string };
      const result = await svcSelectWinner(userId, id, submissionId);
      return reply.send(result);
    } catch (error) {
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
      const result = await svcGetContestAnalytics(userId, id);
      return reply.send(result);
    } catch (error) {
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
      const result = await svcToggleSaveContest(userId, id);
      return reply.send(result);
    } catch (error) {
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
