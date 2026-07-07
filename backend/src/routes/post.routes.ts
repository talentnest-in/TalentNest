import { FastifyInstance } from 'fastify';
import {
  getPosts,
  createPost,
  getPostById,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  deleteComment,
  reportPost,
  pinPost,
  hidePost,
} from '../controllers/post.controller';

export async function postRoutes(server: FastifyInstance) {
  server.register(async (authenticatedServer) => {
    authenticatedServer.addHook('onRequest', authenticatedServer.authenticate);

    authenticatedServer.get('/', getPosts);
    authenticatedServer.post('/', createPost);
    authenticatedServer.get('/:id', getPostById);
    authenticatedServer.put('/:id', updatePost);
    authenticatedServer.delete('/:id', deletePost);
    
    authenticatedServer.post('/:id/like', toggleLike);
    authenticatedServer.post('/:id/comments', addComment);
    authenticatedServer.delete('/:id/comments/:cId', deleteComment);
    authenticatedServer.post('/:id/report', reportPost);
    authenticatedServer.patch('/:id/pin', pinPost);
    authenticatedServer.patch('/:id/hide', hidePost);
  });
}
