import { FastifyInstance } from 'fastify';
import {
  browseContests,
  createContest,
  getContestDetail,
  updateContest,
  deleteContest,
  publishContest,
  pauseContest,
  closeContest,
  reopenContest,
  duplicateContest,
  joinContest,
  leaveContest,
  listParticipants,
  submitEntry,
  updateSubmission,
  withdrawSubmission,
  listSubmissions,
  updateSubmissionStatusById,
  selectWinner,
  getClientContests,
  getContestAnalytics,
  getFreelancerJoinedContests,
  getFreelancerSavedContests,
  toggleSaveContest,
  getMySubmission,
} from '../controllers/contest.controller';

export async function contestRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.get('/', browseContests);
  fastify.get('/:slug', getContestDetail);

  // Protected routes
  fastify.register(async (srv) => {
    srv.addHook('preValidation', srv.authenticate);

    // Client dashboard & analytics (must be before /:id to avoid routing conflicts)
    srv.get('/client/me', getClientContests);
    srv.get('/freelancer/joined', getFreelancerJoinedContests);
    srv.get('/freelancer/saved', getFreelancerSavedContests);

    // Contest CRUD
    srv.post('/', createContest);
    srv.put('/:id', updateContest);
    srv.delete('/:id', deleteContest);

    // Status management
    srv.post('/:id/publish', publishContest);
    srv.post('/:id/pause', pauseContest);
    srv.post('/:id/close', closeContest);
    srv.post('/:id/reopen', reopenContest);
    srv.post('/:id/duplicate', duplicateContest);

    // Participation
    srv.post('/:id/join', joinContest);
    srv.delete('/:id/leave', leaveContest);
    srv.get('/:id/participants', listParticipants);

    // Submissions
    srv.post('/:id/submit', submitEntry);
    srv.put('/:id/submission', updateSubmission);
    srv.delete('/:id/submission', withdrawSubmission);
    srv.get('/:id/submissions', listSubmissions);
    srv.get('/:id/my-submission', getMySubmission);
    srv.patch('/:id/submissions/:submissionId/status', updateSubmissionStatusById);
    srv.post('/:id/winner', selectWinner);

    // Save toggle
    srv.post('/:id/save', toggleSaveContest);

    // Analytics
    srv.get('/:id/analytics', getContestAnalytics);
  });
}
