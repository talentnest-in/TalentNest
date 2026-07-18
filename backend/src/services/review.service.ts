import { prisma } from '../lib/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '../lib/errors';
import { awardExp } from './gamification.service';

export async function createReview(userId: string, courseId: string, body: { rating: number; review: string }) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
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
  });

  if (!enrollment) {
    throw new ForbiddenError('You must be enrolled to review this course');
  }

  const existingReview = await prisma.courseReview.findUnique({
    where: {
      courseId_studentId: {
        courseId,
        studentId: userId,
      },
    },
  });

  if (existingReview) {
    throw new BadRequestError('You have already reviewed this course');
  }

  const review = await prisma.courseReview.create({
    data: {
      courseId,
      studentId: userId,
      rating: body.rating,
      review: body.review,
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  if (body.rating === 5) {
    await awardExp(course.creatorId, 'FIVE_STAR_REVIEW', `Received 5-star review for course: ${course.title}`);
  }

  return review;
}

export async function updateReview(userId: string, reviewId: string, body: { rating?: number; review?: string }) {
  const review = await prisma.courseReview.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new NotFoundError('Review');
  }

  if (review.studentId !== userId) {
    throw new ForbiddenError('You can only edit your own reviews');
  }

  return prisma.courseReview.update({
    where: { id: reviewId },
    data: {
      ...(body.rating && { rating: body.rating }),
      ...(body.review && { review: body.review }),
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });
}

export async function deleteReview(userId: string, reviewId: string) {
  const review = await prisma.courseReview.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new NotFoundError('Review');
  }

  if (review.studentId !== userId) {
    throw new ForbiddenError('You can only delete your own reviews');
  }

  await prisma.courseReview.delete({
    where: { id: reviewId },
  });
}

export async function replyReview(userId: string, reviewId: string, replyText: string) {
  const review = await prisma.courseReview.findUnique({
    where: { id: reviewId },
    include: {
      course: true,
    },
  });

  if (!review) {
    throw new NotFoundError('Review');
  }

  if (review.course.creatorId !== userId) {
    throw new ForbiddenError('Only the course creator can reply to reviews');
  }

  return prisma.courseReview.update({
    where: { id: reviewId },
    data: {
      reply: replyText,
      repliedAt: new Date(),
    },
  });
}

export async function getCourseReviews(courseId: string, pageStr = '1', limitStr = '20') {
  const page = Math.max(1, parseInt(pageStr));
  const limit = Math.min(50, parseInt(limitStr));
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.courseReview.findMany({
      where: { courseId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.courseReview.count({ where: { courseId } }),
  ]);

  const ratingAgg = await prisma.courseReview.aggregate({
    where: { courseId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const averageRating = ratingAgg._avg.rating || 0;

  return {
    reviews,
    averageRating: Math.round(averageRating * 10) / 10,
    reviewCount: total,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function addToWishlist(userId: string, courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new NotFoundError('Course');
  }

  let wishlist = await prisma.courseWishlist.findUnique({
    where: {
      courseId_userId: {
        courseId,
        userId,
      },
    },
  });

  if (!wishlist) {
    wishlist = await prisma.courseWishlist.create({
      data: {
        courseId,
        userId,
      },
    });
  }

  return wishlist;
}

export async function removeFromWishlist(userId: string, courseId: string) {
  await prisma.courseWishlist.delete({
    where: {
      courseId_userId: {
        courseId,
        userId,
      },
    },
  });
}

export async function getWishlist(userId: string) {
  const wishlist = await prisma.courseWishlist.findMany({
    where: { userId },
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
          _count: {
            select: {
              enrollments: true,
              reviews: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const courseIds = wishlist.map(w => w.course.id);
  const ratingAggregations = courseIds.length > 0 ? await prisma.courseReview.groupBy({
    by: ['courseId'],
    _avg: { rating: true },
    _count: { rating: true },
    where: { courseId: { in: courseIds } },
  }) : [];

  const ratingMap = new Map(ratingAggregations.map(r => [r.courseId, { avg: r._avg.rating || 0, count: r._count.rating }]));

  return wishlist.map((item) => {
    const rating = ratingMap.get(item.course.id);
    return {
      ...item,
      course: {
        ...item.course,
        averageRating: rating ? Math.round(rating.avg * 10) / 10 : 0,
        reviewCount: rating?.count || 0,
      },
    };
  });
}

export async function checkWishlist(userId: string, courseId: string) {
  const wishlist = await prisma.courseWishlist.findUnique({
    where: {
      courseId_userId: {
        courseId,
        userId,
      },
    },
  });

  return { inWishlist: !!wishlist };
}
