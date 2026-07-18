import { prisma } from '../lib/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '../lib/errors';

export async function verifyCertificate(code: string) {
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
    throw new NotFoundError('Certificate');
  }

  return certificate;
}

export async function getUserCertificates(userId: string) {
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

  return certificates;
}

export async function getEnrollmentCertificate(userId: string, courseId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId,
        studentId: userId,
      },
    },
  });

  if (!enrollment) {
    throw new NotFoundError('Enrollment');
  }

  if (enrollment.status !== 'COMPLETED') {
    throw new BadRequestError('Course not completed yet');
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
    throw new NotFoundError('Certificate');
  }

  return certificate;
}

export async function getCertificateById(userId: string, id: string) {
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
    throw new NotFoundError('Certificate');
  }

  if (certificate.enrollment.studentId !== userId) {
    throw new ForbiddenError('You do not have access to this certificate');
  }

  return certificate;
}
