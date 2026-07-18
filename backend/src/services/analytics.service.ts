import { prisma } from '../lib/prisma';
import { NotFoundError, ForbiddenError } from '../lib/errors';

export async function getCourseAnalytics(userId: string, courseId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new NotFoundError('Course');
  if (course.creatorId !== userId) {
    throw new ForbiddenError('You can only view analytics for your own courses');
  }

  let analytics = await prisma.courseAnalytics.findUnique({ where: { courseId } });
  if (!analytics) {
    analytics = await prisma.courseAnalytics.create({ data: { courseId } });
  }

  const [enrollments, reviews, revenue] = await Promise.all([
    prisma.enrollment.findMany({
      where: { courseId },
      include: { student: { select: { id: true, name: true, avatar: true } } },
      orderBy: { enrolledAt: 'desc' },
      take: 10,
    }),
    prisma.courseReview.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.coursePurchase.aggregate({
      _sum: { amount: true },
      where: { courseId },
    }),
  ]);

  const completedEnrollments = await prisma.enrollment.count({
    where: { courseId, status: 'COMPLETED' },
  });

  const totalEnrollments = await prisma.enrollment.count({ where: { courseId } });
  const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;

  return {
    ...analytics,
    completionRate,
    recentEnrollments: enrollments,
    recentReviews: reviews,
    totalRevenue: revenue._sum.amount || 0,
  };
}

export async function getPlatformAnalytics(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== 'ADMIN') {
    throw new ForbiddenError('Admin access required');
  }

  const [totalCourses, totalEnrollments, totalRevenue, totalCreators, totalStudents] = await Promise.all([
    prisma.course.count({ where: { status: 'PUBLISHED' } }),
    prisma.enrollment.count(),
    prisma.coursePurchase.aggregate({ _sum: { amount: true } }),
    prisma.creatorProfile.count(),
    prisma.enrollment.groupBy({ by: ['studentId'] }),
  ]);

  const topCourses = await prisma.course.findMany({
    where: { status: 'PUBLISHED' },
    include: { _count: { select: { enrollments: true } } },
    orderBy: { enrollments: { _count: 'desc' } },
    take: 10,
  });

  return {
    totalCourses,
    totalEnrollments,
    totalRevenue: totalRevenue._sum.amount || 0,
    totalCreators,
    totalStudents: totalStudents.length,
    topCourses,
  };
}
