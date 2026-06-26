import { FastifyInstance } from 'fastify';
import {
  getProfile,
  upsertProfile,
  uploadResume,
  uploadAvatar,
  addSkill,
  deleteSkill,
  addExperience,
  updateExperience,
  deleteExperience,
  addEducation,
  updateEducation,
  deleteEducation,
} from '../controllers/freelancer.controller';

export async function freelancerRoutes(server: FastifyInstance) {
  server.addHook('preValidation', server.authenticate);

  server.get('/me', getProfile);
  server.put('/me', upsertProfile);
  server.post('/upload-resume', uploadResume);
  server.post('/upload-avatar', uploadAvatar);

  server.post('/skills', addSkill);
  server.delete('/skills/:id', deleteSkill);

  server.post('/experience', addExperience);
  server.put('/experience/:id', updateExperience);
  server.delete('/experience/:id', deleteExperience);

  server.post('/education', addEducation);
  server.put('/education/:id', updateEducation);
  server.delete('/education/:id', deleteEducation);
}
