import { FastifyInstance } from 'fastify';
import {
  getClientProfile,
  updateClientProfile,
  uploadClientLogo,
  getClientDashboard,
} from '../controllers/client.controller';
import { getMyCompany, createOrUpdateCompany, uploadCompanyLogo } from '../controllers/company.controller';

export async function clientRoutes(server: FastifyInstance) {
  server.addHook('preValidation', server.authenticate);

  // Client Profile
  server.get('/me', getClientProfile);
  server.put('/me', updateClientProfile);
  server.post('/upload-logo', uploadClientLogo);
  server.get('/dashboard', getClientDashboard);

  // Company (nested under /clients)
  server.get('/company', getMyCompany);
  server.post('/company', createOrUpdateCompany);
  server.put('/company', createOrUpdateCompany);
  server.post('/company/upload-logo', uploadCompanyLogo);
}
