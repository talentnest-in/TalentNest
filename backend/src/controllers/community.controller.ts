import { FastifyRequest, FastifyReply } from 'fastify';
import { getCommunities as svcGetCommunities, createCommunity as svcCreateCommunity, getCommunityBySlug as svcGetCommunityBySlug, updateCommunity as svcUpdateCommunity, deleteCommunity as svcDeleteCommunity, joinCommunity as svcJoinCommunity, leaveCommunity as svcLeaveCommunity, getCommunityMembers as svcGetCommunityMembers, promoteMember as svcPromoteMember, uploadBanner as svcUploadBanner, uploadLogo as svcUploadLogo } from '../services/community.service';
import { AppError } from '../lib/errors';

const communityController = {
  async getCommunities(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await svcGetCommunities(request.query as any);
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'getCommunities failed');
      return reply.status(500).send({ error: 'Failed to fetch communities' });
    }
  },

  async createCommunity(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const result = await svcCreateCommunity(userId, request.body);
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'createCommunity failed');
      return reply.status(500).send({ error: 'Failed to create community' });
    }
  },

  async getCommunityBySlug(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { slug } = request.params as { slug: string };
      const userId = (request as any).user?.id;
      const result = await svcGetCommunityBySlug(slug, userId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'getCommunityBySlug failed');
      return reply.status(500).send({ error: 'Failed to fetch community' });
    }
  },

  async updateCommunity(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id: communityId } = request.params as { id: string };
      const result = await svcUpdateCommunity(communityId, userId, request.body);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'updateCommunity failed');
      return reply.status(500).send({ error: 'Failed to update community' });
    }
  },

  async deleteCommunity(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id: communityId } = request.params as { id: string };
      await svcDeleteCommunity(communityId, userId);
      return reply.send({ success: true });
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'deleteCommunity failed');
      return reply.status(500).send({ error: 'Failed to delete community' });
    }
  },

  async joinCommunity(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id: communityId } = request.params as { id: string };
      const result = await svcJoinCommunity(communityId, userId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'joinCommunity failed');
      return reply.status(500).send({ error: 'Failed to join community' });
    }
  },

  async leaveCommunity(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id: communityId } = request.params as { id: string };
      const result = await svcLeaveCommunity(communityId, userId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      request.log.error(error, 'leaveCommunity failed');
      return reply.status(500).send({ error: 'Failed to leave community' });
    }
  },

  async getCommunityMembers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id: communityId } = request.params as { id: string };
      const result = await svcGetCommunityMembers(communityId, request.query as any);
      return reply.send(result);
    } catch (error) {
      request.log.error(error, 'getCommunityMembers failed');
      return reply.status(500).send({ error: 'Failed to fetch members' });
    }
  },

  async uploadBanner(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const file = await request.file();
      if (!file) return reply.status(400).send({ error: 'No file uploaded' });
      const updated = await svcUploadBanner(id, userId, file);
      return reply.send(updated);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to upload banner' });
    }
  },

  async uploadLogo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const file = await request.file();
      if (!file) return reply.status(400).send({ error: 'No file uploaded' });
      const updated = await svcUploadLogo(id, userId, file);
      return reply.send(updated);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to upload logo' });
    }
  },

  async promoteMember(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id: communityId, memberId } = request.params as { id: string; memberId: string };
      const body = request.body as any;
      const result = await svcPromoteMember(userId, communityId, memberId, body);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) return reply.status(error.statusCode).send({ error: error.message });
      return reply.status(500).send({ error: 'Failed to promote member' });
    }
  },
};

export const {
  getCommunities, createCommunity, getCommunityBySlug, updateCommunity, deleteCommunity,
  joinCommunity, leaveCommunity, getCommunityMembers, uploadBanner, uploadLogo, promoteMember,
} = communityController;
