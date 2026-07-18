import { prisma } from '../lib/prisma';
import crypto from 'crypto';
import { NotFoundError, ForbiddenError, BadRequestError } from '../lib/errors';
import { awardExp } from './gamification.service';

export async function enrollCourse(userId: string, courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new NotFoundError('Course');
  }

  if (course.status !== 'PUBLISHED') {
    throw new BadRequestError('Course is not available for enrollment');
  }

  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId,
        studentId: userId,
      },
    },
  });

  if (existingEnrollment) {
    throw new BadRequestError('Already enrolled in this course');
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      courseId,
      studentId: userId,
      status: 'ACTIVE',
    },
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
    },
  });

  await prisma.coursePurchase.create({
    data: {
      courseId,
      studentId: userId,
      amount: course.discountPrice || course.price,
      currency: 'USD',
      discountAmount: course.discountPrice ? course.price - course.discountPrice : 0,
    },
  });

  await prisma.courseAnalytics.upsert({
    where: { courseId },
    create: {
      courseId,
      totalEnrollments: 1,
    },
    update: {
      totalEnrollments: {
        increment: 1,
      },
    },
  });

  return enrollment;
}

export async function getUserEnrollments(userId: string, status?: string) {
  const where: any = { studentId: userId };
  if (status) {
    where.status = status;
  }

  const enrollments = await prisma.enrollment.findMany({
    where,
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
      progressRecords: true,
    },
    orderBy: { enrolledAt: 'desc' },
  });

  return enrollments;
}

export async function getEnrollment(userId: string, courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      category: true,
      sections: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  });

  if (!course) {
    throw new NotFoundError('Course');
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId,
        studentId: userId,
      },
    },
    include: {
      progressRecords: true,
      certificate: true,
    },
  });

  if (!enrollment) {
    return {
      enrolled: false,
      progress: 0,
      completed: false,
      enrollmentId: null,
      course,
      progressRecords: [],
    };
  }

  const lessonProgress = await prisma.lessonProgress.findMany({
    where: { enrollmentId: enrollment.id },
  });

  const courseWithProgress = {
    ...enrollment,
    course: {
      ...course,
      sections: course.sections.map(section => ({
        ...section,
        lessons: section.lessons.map(lesson => ({
          ...lesson,
          progress: lessonProgress.find(p => p.lessonId === lesson.id) || null,
        })),
      })),
    },
  };

  const totalLessons = course.sections.flatMap(s => s.lessons).length;
  const completedLessons = lessonProgress.filter(p => p.completed).length;
  const lessonProgressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const isCourseComplete = completedLessons === totalLessons;

  if (isCourseComplete && enrollment.status !== 'COMPLETED') {
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }

  return {
    ...courseWithProgress,
    enrolled: true,
    progress: Math.round(lessonProgressPercent),
    completed: isCourseComplete,
  };
}

export async function updateLessonProgress(
  userId: string,
  lessonId: string,
  data: { completed?: boolean; timeSpent?: number }
) {
  const { completed, timeSpent } = data;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      section: {
        include: {
          course: true,
        },
      },
    },
  });

  if (!lesson) {
    throw new NotFoundError('Lesson');
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId: lesson.section.courseId,
        studentId: userId,
      },
    },
    include: {
      certificate: true,
    },
  });

  if (!enrollment) {
    throw new ForbiddenError('Not enrolled in this course');
  }

  const progress = await prisma.lessonProgress.upsert({
    where: {
      enrollmentId_lessonId: {
        enrollmentId: enrollment.id,
        lessonId,
      },
    },
    create: {
      enrollmentId: enrollment.id,
      lessonId,
      completed: completed || false,
      completedAt: completed ? new Date() : null,
      timeSpent: timeSpent || 0,
    },
    update: {
      ...(completed !== undefined && { completed }),
      ...(completed !== undefined && { completedAt: completed ? new Date() : null }),
      ...(timeSpent !== undefined && { timeSpent: { increment: timeSpent } }),
      lastAccessedAt: new Date(),
    },
  });

  const allLessons = await prisma.lesson.findMany({
    where: {
      section: {
        courseId: lesson.section.courseId,
      },
    },
  });

  const completedLessons = await prisma.lessonProgress.count({
    where: {
      enrollmentId: enrollment.id,
      completed: true,
    },
  });

  const progressPercentage = (completedLessons / allLessons.length) * 100;

  const isCourseComplete = completedLessons === allLessons.length;
  const updateData: any = {
    progress: progressPercentage,
    lastAccessedAt: new Date(),
  };

  if (isCourseComplete && enrollment.status !== 'COMPLETED') {
    updateData.status = 'COMPLETED';
    updateData.completedAt = new Date();

    const existingCertificate = await prisma.certificate.findUnique({
      where: { enrollmentId: enrollment.id },
    });

    if (!existingCertificate) {
      const certificateId = `TN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const verificationCode = crypto.randomBytes(16).toString('hex').toUpperCase();

      await prisma.certificate.create({
        data: {
          enrollmentId: enrollment.id,
          certificateId,
          verificationCode,
        },
      });
    }

    await awardExp(userId, 'COURSE_COMPLETE', `Completed course: ${lesson.section.course.title}`);
  }

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: updateData,
  });

  return {
    progress,
    courseProgress: progressPercentage,
  };
}

export async function cancelEnrollment(userId: string, courseId: string) {
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

  if (enrollment.status === 'CANCELLED') {
    throw new BadRequestError('Enrollment already cancelled');
  }

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: {
      status: 'CANCELLED',
    },
  });
}
