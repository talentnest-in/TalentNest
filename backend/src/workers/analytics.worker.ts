import { Job } from 'bullmq';
import { queueManager, QUEUES } from '../lib/queue';
import { prisma } from '../lib/prisma';

interface UpdateCourseAnalyticsData {
  courseId: string;
}

interface UpdatePlatformAnalyticsData {
  // No specific data needed, runs full aggregation
}

export async function updateCourseAnalyticsProcessor(job: Job<UpdateCourseAnalyticsData>): Promise<void> {
  const { courseId } = job.data;

  try {
    const [totalViews, totalEnrollments, totalRevenue, averageRating, completionRate] = await Promise.all([
      prisma.course.findUnique({ where: { id: courseId }, select: { _count: { select: { wishlists: true } } } }),
      prisma.enrollment.count({ where: { courseId } }),
      prisma.coursePurchase.aggregate({ _sum: { amount: true }, where: { courseId } }),
      prisma.courseReview.aggregate({ _avg: { rating: true }, where: { courseId } }),
      (async () => {
        const completed = await prisma.enrollment.count({ where: { courseId, status: 'COMPLETED' } });
        const total = await prisma.enrollment.count({ where: { courseId } });
        return total > 0 ? (completed / total) * 100 : 0;
      })(),
    ]);

    await prisma.courseAnalytics.upsert({
      where: { courseId },
      create: {
        courseId,
        totalViews: totalViews?._count.wishlists || 0,
        totalEnrollments,
        totalRevenue: totalRevenue._sum.amount || 0,
        averageRating: averageRating._avg.rating || 0,
        completionRate,
      },
      update: {
        totalViews: totalViews?._count.wishlists || 0,
        totalEnrollments,
        totalRevenue: totalRevenue._sum.amount || 0,
        averageRating: averageRating._avg.rating || 0,
        completionRate,
      },
    });
  } catch (error) {
    console.error('[AnalyticsWorker] Course analytics update failed:', error);
  }
}

export async function platformAnalyticsProcessor(job: Job<UpdatePlatformAnalyticsData>): Promise<void> {
  try {
    const [totalCourses, totalEnrollments, totalRevenue, totalCreators] = await Promise.all([
      prisma.course.count({ where: { status: 'PUBLISHED' } }),
      prisma.enrollment.count(),
      prisma.coursePurchase.aggregate({ _sum: { amount: true } }),
      prisma.creatorProfile.count(),
    ]);

    console.log('[AnalyticsWorker] Platform stats:', {
      totalCourses, totalEnrollments,
      totalRevenue: totalRevenue._sum.amount || 0, totalCreators,
    });
  } catch (error) {
    console.error('[AnalyticsWorker] Platform analytics failed:', error);
  }
}

export async function analyticsRouter(job: Job): Promise<void> {
  const { type, courseId } = job.data;
  switch (type) {
    case 'course_analytics':
      await updateCourseAnalyticsProcessor(job as Job<UpdateCourseAnalyticsData>);
      break;
    case 'platform_analytics':
      await platformAnalyticsProcessor(job);
      break;
    default:
      console.warn(`[AnalyticsWorker] Unknown type: ${type}`);
  }
}

export function registerAnalyticsWorker(): void {
  queueManager.defineQueue(QUEUES.ANALYTICS);
  queueManager.defineWorker(QUEUES.ANALYTICS, analyticsRouter, { concurrency: 2 });
  console.log('[Queue] Analytics worker registered');
}
