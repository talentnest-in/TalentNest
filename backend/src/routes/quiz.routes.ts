import { FastifyInstance } from 'fastify';
import { quizController } from '../controllers/quiz.controller';

export async function quizRoutes(fastify: FastifyInstance) {
  // Create quiz
  fastify.post('/lessons/:lessonId/quiz', {
    preHandler: [fastify.authenticate],
    handler: quizController.createQuiz,
  });

  // Update quiz
  fastify.put('/quizzes/:quizId', {
    preHandler: [fastify.authenticate],
    handler: quizController.updateQuiz,
  });

  // Delete quiz
  fastify.delete('/quizzes/:quizId', {
    preHandler: [fastify.authenticate],
    handler: quizController.deleteQuiz,
  });

  // Create question
  fastify.post('/quizzes/:quizId/questions', {
    preHandler: [fastify.authenticate],
    handler: quizController.createQuestion,
  });

  // Create answer
  fastify.post('/questions/:questionId/answers', {
    preHandler: [fastify.authenticate],
    handler: quizController.createAnswer,
  });

  // Get quiz attempts (must be before getQuiz to avoid route conflict)
  fastify.get('/quizzes/:quizId/attempts', {
    preHandler: [fastify.authenticate],
    handler: quizController.getAttempts,
  });

  // Get quiz for student
  fastify.get('/quizzes/:quizId', {
    preHandler: [fastify.authenticate],
    handler: quizController.getQuiz,
  });

  // Submit quiz attempt
  fastify.post('/quizzes/:quizId/attempt', {
    preHandler: [fastify.authenticate],
    handler: quizController.submitAttempt,
  });
}
