import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';

export const certificateController = {
  // Get certificate by verification code (public)
  async verifyCertificate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { code } = request.params as { code: string };

      const certificate = await prisma.certificate.findUnique({
        where: { verificationCode: code },
        include: {
          enrollment: {
            include: {
              course: {
                include: {
                  creator: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              student: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!certificate) {
        return reply.status(404).send({ error: 'Certificate not found' });
      }

      return reply.send(certificate);
    } catch (error) {
      request.log.error(error, 'Failed to verify certificate');
      return reply.status(500).send({ error: 'Failed to verify certificate' });
    }
  },

  // Get user's certificates
  async getUserCertificates(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;

      const certificates = await prisma.certificate.findMany({
        where: {
          enrollment: {
            studentId: userId,
          },
        },
        include: {
          enrollment: {
            include: {
              course: {
                include: {
                  creator: {
                    select: {
                      id: true,
                      name: true,
                      avatar: true,
                    },
                  },
                  category: true,
                },
              },
            },
          },
        },
        orderBy: { issuedAt: 'desc' },
      });

      return reply.send(certificates);
    } catch (error) {
      request.log.error(error, 'Failed to fetch certificates');
      return reply.status(500).send({ error: 'Failed to fetch certificates' });
    }
  },

  // Get certificate for specific enrollment
  async getEnrollmentCertificate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { courseId } = request.params as { courseId: string };

      const enrollment = await prisma.enrollment.findUnique({
        where: {
          courseId_studentId: {
            courseId,
            studentId: userId,
          },
        },
      });

      if (!enrollment) {
        return reply.status(404).send({ error: 'Enrollment not found' });
      }

      if (enrollment.status !== 'COMPLETED') {
        return reply.status(400).send({ error: 'Course not completed yet' });
      }

      const certificate = await prisma.certificate.findUnique({
        where: { enrollmentId: enrollment.id },
        include: {
          enrollment: {
            include: {
              course: {
                include: {
                  creator: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              student: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!certificate) {
        return reply.status(404).send({ error: 'Certificate not found' });
      }

      return reply.send(certificate);
    } catch (error) {
      request.log.error(error, 'Failed to fetch certificate');
      return reply.status(500).send({ error: 'Failed to fetch certificate' });
    }
  },

  // Get certificate by ID (with authorization check)
  async getCertificateById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };

      const certificate = await prisma.certificate.findUnique({
        where: { id },
        include: {
          enrollment: {
            include: {
              course: {
                include: {
                  creator: {
                    select: {
                      id: true,
                      name: true,
                      avatar: true,
                    },
                  },
                  category: true,
                },
              },
              student: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      if (!certificate) {
        return reply.status(404).send({ error: 'Certificate not found' });
      }

      // Authorization check: only the certificate owner can access it
      if (certificate.enrollment.studentId !== userId) {
        return reply.status(403).send({ error: 'You do not have access to this certificate' });
      }

      return reply.send(certificate);
    } catch (error) {
      request.log.error(error, 'Failed to fetch certificate');
      return reply.status(500).send({ error: 'Failed to fetch certificate' });
    }
  },
};
