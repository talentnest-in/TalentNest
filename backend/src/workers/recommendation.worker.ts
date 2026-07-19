import { Job } from 'bullmq';
import { queueManager, QUEUES } from '../lib/queue';
import { prisma } from '../lib/prisma';
import { getCacheService } from '../lib/cache';
import { logError, logInfo } from '../lib/logger';

interface GenerateRecommendationsData {
  userId: string;
}

export async function recommendationProcessor(job: Job<GenerateRecommendationsData>): Promise<void> {
  const { userId } = job.data;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        freelancerProfile: {
          include: { skills: true },
        },
        studentEnrollments: {
          include: {
            course: {
              include: { tags: { include: { tag: true } } },
            },
          },
        },
      },
    });

    if (!user) return;

    // Collect user skills and interests
    const userSkills = new Set<string>();
    const enrolledTagIds = new Set<string>();
    const enrolledCourseIds = new Set<string>();

    if (user.freelancerProfile) {
      user.freelancerProfile.skills.forEach(s => userSkills.add(s.name.toLowerCase()));
    }

    user.studentEnrollments.forEach(e => {
      enrolledCourseIds.add(e.courseId);
      e.course.tags.forEach(t => enrolledTagIds.add(t.tagId));
    });

    // Find relevant courses: matching tags/skills, not enrolled, published
    const recommendedCourses = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
        id: { notIn: Array.from(enrolledCourseIds) },
        OR: [
          { tags: { some: { tagId: { in: Array.from(enrolledTagIds) } } } },
          {
            creator: {
              freelancerProfile: {
                skills: { some: { name: { in: Array.from(userSkills), mode: 'insensitive' } } },
              },
            },
          },
        ],
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnail: true,
        level: true,
        price: true,
        discountPrice: true,
        category: { select: { name: true } },
        creator: { select: { name: true, avatar: true } },
        _count: { select: { enrollments: true, reviews: true } },
      },
    });

    // Cache recommendations for 1 hour
    const cache = getCacheService();
    if (recommendedCourses.length > 0) {
      await cache.set(
        `recommendations:${userId}`,
        JSON.stringify(recommendedCourses),
        3600
      );
    } else {
      // If no personalized recs, cache a placeholder
      await cache.set(`recommendations:${userId}`, '[]', 3600);
    }
  } catch (error) {
    logError('[RecommendationWorker]', error, { context: 'generate_recommendations', userId });
    throw error;
  }
}

export function registerRecommendationWorker(): void {
  queueManager.defineQueue(QUEUES.RECOMMENDATION);
  queueManager.defineWorker(QUEUES.RECOMMENDATION, recommendationProcessor, { concurrency: 2 });
  logInfo('[Queue]', 'Recommendation worker registered');
}
