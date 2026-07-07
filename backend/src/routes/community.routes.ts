import { FastifyInstance } from 'fastify';
import {
  getCommunities,
  createCommunity,
  getCommunityBySlug,
  updateCommunity,
  deleteCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunityMembers,
  uploadBanner,
  uploadLogo,
  promoteMember,
} from '../controllers/community.controller';
import { getCommunityPosts } from '../controllers/post.controller';

export async function communityRoutes(server: FastifyInstance) {
  // Public routes
  server.get('/', getCommunities);
  server.get('/:slug', getCommunityBySlug);
  
  // Need to be authenticated
  server.register(async (authenticatedServer) => {
    authenticatedServer.addHook('onRequest', authenticatedServer.authenticate);

    authenticatedServer.post('/', createCommunity);
    authenticatedServer.put('/:id', updateCommunity);
    authenticatedServer.delete('/:id', deleteCommunity);
    
    authenticatedServer.post('/:id/join', joinCommunity);
    authenticatedServer.delete('/:id/leave', leaveCommunity);
    authenticatedServer.get('/:id/members', getCommunityMembers);
    authenticatedServer.patch('/:id/members/:userId/role', promoteMember);
    authenticatedServer.get('/:id/posts', getCommunityPosts);

    // Multi-part routes for banner and logo
    authenticatedServer.post('/:id/banner', uploadBanner);
    authenticatedServer.post('/:id/logo', uploadLogo);
  });
}
