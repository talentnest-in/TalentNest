import { prisma } from '../lib/prisma';
import { NotFoundError } from '../lib/errors';

export async function getCreatorProfile(userId: string) {
  let profile = await prisma.creatorProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  if (!profile) {
    profile = await prisma.creatorProfile.create({
      data: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  return profile;
}

export async function updateCreatorProfile(
  userId: string,
  body: { bio?: string; website?: string; socialLinks?: Record<string, any> }
) {
  const profile = await prisma.creatorProfile.update({
    where: { userId },
    data: {
      ...(body.bio !== undefined && { bio: body.bio }),
      ...(body.website && { website: body.website }),
      ...(body.socialLinks && { socialLinks: body.socialLinks }),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  return profile;
}

export async function getCreatorStats(userId: string) {
  const [totalCourses, publishedCourses, draftCourses, totalEnrollments, totalRevenue, averageRating] = await Promise.all([
    prisma.course.count({ where: { creatorId: userId } }),
    prisma.course.count({ where: { creatorId: userId, status: 'PUBLISHED' } }),
    prisma.course.count({ where: { creatorId: userId, status: 'DRAFT' } }),
    prisma.enrollment.count({
      where: {
        course: { creatorId: userId },
      },
    }),
    prisma.coursePurchase.aggregate({
      _sum: { amount: true },
      where: {
        course: { creatorId: userId },
      },
    }),
    prisma.courseReview.aggregate({
      _avg: { rating: true },
      where: {
        course: { creatorId: userId },
      },
    }),
  ]);

  return {
    totalCourses,
    publishedCourses,
    draftCourses,
    totalEnrollments,
    totalRevenue: totalRevenue._sum.amount || 0,
    averageRating: averageRating._avg.rating || 0,
  };
}

export async function getPublicCreatorProfile(creatorId: string) {
  const profile = await prisma.creatorProfile.findUnique({
    where: { userId: creatorId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  if (!profile) {
    throw new NotFoundError('Creator profile');
  }

  const courses = await prisma.course.findMany({
    where: {
      creatorId,
      status: 'PUBLISHED',
    },
    include: {
      category: true,
      _count: {
        select: {
          enrollments: true,
          reviews: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  const courseIds = courses.map(c => c.id);
  const ratingAggregations = courseIds.length > 0 ? await prisma.courseReview.groupBy({
    by: ['courseId'],
    _avg: { rating: true },
    _count: { rating: true },
    where: { courseId: { in: courseIds } },
  }) : [];
  const ratingMap = new Map(ratingAggregations.map(r => [r.courseId, { avg: r._avg.rating || 0, count: r._count.rating }]));

  const coursesWithRating = courses.map((course) => {
    const rating = ratingMap.get(course.id);
    return {
      ...course,
      averageRating: rating ? Math.round(rating.avg * 10) / 10 : 0,
      reviewCount: rating?.count || 0,
    };
  });

  return {
    ...profile,
    courses: coursesWithRating,
  };
}
