import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';

export const quizController = {
  // Create quiz
  async createQuiz(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { lessonId } = request.params as { lessonId: string };
      const body = request.body as any;

      // Check if lesson exists and user is the course creator
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          section: {
            include: { course: true },
          },
        },
      });

      if (!lesson) {
        return reply.status(404).send({ error: 'Lesson not found' });
      }

      if (lesson.section.course.creatorId !== userId) {
        return reply.status(403).send({ error: 'You can only edit your own courses' });
      }

      // Check if quiz already exists for this lesson
      const existingQuiz = await prisma.quiz.findUnique({
        where: { lessonId },
      });

      if (existingQuiz) {
        return reply.status(400).send({ error: 'Quiz already exists for this lesson' });
      }

      const quiz = await prisma.quiz.create({
        data: {
          lessonId,
          title: body.title,
          description: body.description,
          passPercentage: body.passPercentage || 70,
          maxAttempts: body.maxAttempts || 3,
          timeLimit: body.timeLimit,
          shuffleQuestions: body.shuffleQuestions || false,
        },
      });

      return reply.status(201).send(quiz);
    } catch (error) {
      request.log.error(error, 'Failed to create quiz');
      return reply.status(500).send({ error: 'Failed to create quiz' });
    }
  },

  // Update quiz
  async updateQuiz(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { quizId } = request.params as { quizId: string };
      const body = request.body as any;

      // Check if quiz exists and user is the course creator
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          lesson: {
            include: {
              section: {
                include: { course: true },
              },
            },
          },
        },
      });

      if (!quiz) {
        return reply.status(404).send({ error: 'Quiz not found' });
      }

      if (quiz.lesson.section.course.creatorId !== userId) {
        return reply.status(403).send({ error: 'You can only edit your own courses' });
      }

      const updatedQuiz = await prisma.quiz.update({
        where: { id: quizId },
        data: {
          ...(body.title && { title: body.title }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.passPercentage && { passPercentage: body.passPercentage }),
          ...(body.maxAttempts && { maxAttempts: body.maxAttempts }),
          ...(body.timeLimit !== undefined && { timeLimit: body.timeLimit }),
          ...(body.shuffleQuestions !== undefined && { shuffleQuestions: body.shuffleQuestions }),
        },
      });

      return reply.send(updatedQuiz);
    } catch (error) {
      request.log.error(error, 'Failed to update quiz');
      return reply.status(500).send({ error: 'Failed to update quiz' });
    }
  },

  // Delete quiz
  async deleteQuiz(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { quizId } = request.params as { quizId: string };

      // Check if quiz exists and user is the course creator
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          lesson: {
            include: {
              section: {
                include: { course: true },
              },
            },
          },
        },
      });

      if (!quiz) {
        return reply.status(404).send({ error: 'Quiz not found' });
      }

      if (quiz.lesson.section.course.creatorId !== userId) {
        return reply.status(403).send({ error: 'You can only edit your own courses' });
      }

      await prisma.quiz.delete({
        where: { id: quizId },
      });

      return reply.status(204).send();
    } catch (error) {
      request.log.error(error, 'Failed to delete quiz');
      return reply.status(500).send({ error: 'Failed to delete quiz' });
    }
  },

  // Create question
  async createQuestion(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { quizId } = request.params as { quizId: string };
      const body = request.body as any;

      // Check if quiz exists and user is the course creator
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          lesson: {
            include: {
              section: {
                include: { course: true },
              },
            },
          },
        },
      });

      if (!quiz) {
        return reply.status(404).send({ error: 'Quiz not found' });
      }

      if (quiz.lesson.section.course.creatorId !== userId) {
        return reply.status(403).send({ error: 'You can only edit your own courses' });
      }

      // Get max order for this quiz
      const maxOrder = await prisma.quizQuestion.findFirst({
        where: { quizId },
        orderBy: { order: 'desc' },
      });

      const question = await prisma.quizQuestion.create({
        data: {
          quizId,
          question: body.question,
          explanation: body.explanation,
          order: (maxOrder?.order || 0) + 1,
          points: body.points || 1,
        },
      });

      return reply.status(201).send(question);
    } catch (error) {
      request.log.error(error, 'Failed to create question');
      return reply.status(500).send({ error: 'Failed to create question' });
    }
  },

  // Create answer
  async createAnswer(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { questionId } = request.params as { questionId: string };
      const body = request.body as any;

      // Check if question exists and user is the course creator
      const question = await prisma.quizQuestion.findUnique({
        where: { id: questionId },
        include: {
          quiz: {
            include: {
              lesson: {
                include: {
                  section: {
                    include: { course: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!question) {
        return reply.status(404).send({ error: 'Question not found' });
      }

      if (question.quiz.lesson.section.course.creatorId !== userId) {
        return reply.status(403).send({ error: 'You can only edit your own courses' });
      }

      // Get max order for this question
      const maxOrder = await prisma.quizAnswer.findFirst({
        where: { questionId },
        orderBy: { order: 'desc' },
      });

      const answer = await prisma.quizAnswer.create({
        data: {
          questionId,
          answer: body.answer,
          isCorrect: body.isCorrect || false,
          order: (maxOrder?.order || 0) + 1,
        },
      });

      return reply.status(201).send(answer);
    } catch (error) {
      request.log.error(error, 'Failed to create answer');
      return reply.status(500).send({ error: 'Failed to create answer' });
    }
  },

  // Get quiz for student
  async getQuiz(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { quizId } = request.params as { quizId: string };

      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          lesson: {
            include: {
              section: {
                include: { course: true },
              },
            },
          },
          questions: {
            include: {
              answers: {
                select: {
                  id: true,
                  answer: true,
                  order: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!quiz) {
        return reply.status(404).send({ error: 'Quiz not found' });
      }

      // Check if user is enrolled
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          courseId_studentId: {
            courseId: quiz.lesson.section.courseId,
            studentId: userId,
          },
        },
      });

      if (!enrollment) {
        return reply.status(403).send({ error: 'Not enrolled in this course' });
      }

      // Check attempt count
      const attemptCount = await prisma.quizAttempt.count({
        where: {
          quizId,
          enrollmentId: enrollment.id,
        },
      });

      if (attemptCount >= quiz.maxAttempts) {
        return reply.status(400).send({ error: 'Maximum attempts reached' });
      }

      // Shuffle questions if enabled
      let questions = quiz.questions;
      if (quiz.shuffleQuestions) {
        questions = [...questions].sort(() => Math.random() - 0.5);
      }

      return reply.send({
        ...quiz,
        questions,
        remainingAttempts: quiz.maxAttempts - attemptCount,
      });
    } catch (error) {
      request.log.error(error, 'Failed to fetch quiz');
      return reply.status(500).send({ error: 'Failed to fetch quiz' });
    }
  },

  // Submit quiz attempt
  async submitAttempt(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { quizId } = request.params as { quizId: string };
      const { answers } = request.body as { answers: { questionId: string; answerId: string }[] };

      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          lesson: {
            include: {
              section: {
                include: { course: true },
              },
            },
          },
          questions: {
            include: {
              answers: true,
            },
          },
        },
      });

      if (!quiz) {
        return reply.status(404).send({ error: 'Quiz not found' });
      }

      // Check enrollment
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          courseId_studentId: {
            courseId: quiz.lesson.section.courseId,
            studentId: userId,
          },
        },
      });

      if (!enrollment) {
        return reply.status(403).send({ error: 'Not enrolled in this course' });
      }

      // Calculate score
      let correctAnswers = 0;
      const answersMap = new Map(answers.map(a => [a.questionId, a.answerId]));

      for (const question of quiz.questions) {
        const selectedAnswerId = answersMap.get(question.id);
        const correctAnswer = question.answers.find(a => a.isCorrect);
        
        if (selectedAnswerId === correctAnswer?.id) {
          correctAnswers++;
        }
      }

      const score = (correctAnswers / quiz.questions.length) * 100;
      const passed = score >= quiz.passPercentage;

      // Get attempt number
      const attemptCount = await prisma.quizAttempt.count({
        where: {
          quizId,
          enrollmentId: enrollment.id,
        },
      });

      // Create attempt
      const attempt = await prisma.quizAttempt.create({
        data: {
          quizId,
          enrollmentId: enrollment.id,
          score,
          passed,
          attemptNumber: attemptCount + 1,
          completedAt: new Date(),
        },
      });

      return reply.send(attempt);
    } catch (error) {
      request.log.error(error, 'Failed to submit attempt');
      return reply.status(500).send({ error: 'Failed to submit attempt' });
    }
  },

  // Get quiz attempts
  async getAttempts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { quizId } = request.params as { quizId: string };

      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          lesson: {
            include: {
              section: {
                include: { course: true },
              },
            },
          },
        },
      });

      if (!quiz) {
        return reply.status(404).send({ error: 'Quiz not found' });
      }

      const enrollment = await prisma.enrollment.findUnique({
        where: {
          courseId_studentId: {
            courseId: quiz.lesson.section.courseId,
            studentId: userId,
          },
        },
      });

      if (!enrollment) {
        return reply.status(403).send({ error: 'Not enrolled in this course' });
      }

      const attempts = await prisma.quizAttempt.findMany({
        where: {
          quizId,
          enrollmentId: enrollment.id,
        },
        orderBy: { startedAt: 'desc' },
      });

      const latestAttempt = attempts[0] || null;
      const remainingAttempts = quiz.maxAttempts - attempts.length;

      return reply.send({
        attempts,
        latestScore: latestAttempt?.score || 0,
        passed: latestAttempt?.passed || false,
        remainingAttempts: Math.max(0, remainingAttempts),
        attemptCount: attempts.length,
      });
    } catch (error) {
      request.log.error(error, 'Failed to fetch attempts');
      return reply.status(500).send({ error: 'Failed to fetch attempts' });
    }
  },
};
