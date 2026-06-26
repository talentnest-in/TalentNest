import { FastifyInstance } from 'fastify';
import {
  getProjects,
  addProject,
  updateProject,
  deleteProject,
  uploadProjectImage,
} from '../controllers/portfolio.controller';

export async function portfolioRoutes(server: FastifyInstance) {
  server.addHook('preValidation', server.authenticate);

  server.get('/', getProjects);
  server.post('/', addProject);
  server.put('/:id', updateProject);
  server.delete('/:id', deleteProject);
  server.post('/upload-image', uploadProjectImage);
}
