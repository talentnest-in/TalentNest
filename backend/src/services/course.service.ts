import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { NotFoundError, ForbiddenError, BadRequestError } from '../lib/errors';
import { awardExp } from './gamification.service';

export const createCourseSchema = z.object({
  categoryId: z.string(),
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  price: z.number().min(0).optional(),
  discountPrice: z.number().min(0).optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  language: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  whatYouWillLearn: z.array(z.string()).optional(),
  targetAudience: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  thumbnail: z.string().optional(),
});

export const updateCourseSchema = z.object({
  categoryId: z.string().optional(),
  title: z.string().min(1).optional(),
  subtitle: z.string().optional(),
  description: z.string().min(1).optional(),
  thumbnail: z.string().optional(),
  price: z.number().min(0).optional(),
  discountPrice: z.number().min(0).optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  language: z.string().optional(),
  duration: z.number().int().min(0).optional(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED']).optional(),
  visibility: z.boolean().optional(),
  requirements: z.array(z.string()).optional(),
  whatYouWillLearn: z.array(z.string()).optional(),
  targetAudience: z.array(z.string()).optional(),
});

const validLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

export async function getAllCourses(params: {
  search?: string;
  category?: string;
  level?: string;
  language?: string;
  minPrice?: string;
  maxPrice?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: string;
  limit?: string;
}) {
  const {
    search,
    category,
    level,
    language,
    minPrice,
    maxPrice,
    status = 'PUBLISHED',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = '1',
    limit = '20',
  } = params;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where: any = { status };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (category) {
    where.categoryId = category;
  }

  if (level) {
    where.level = level;
  }

  if (language) {
    where.language = language;
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }

  const orderBy: any = {};
  const validSortFields = ['createdAt', 'updatedAt', 'title', 'price', 'level'];
  if (validSortFields.includes(sortBy)) {
    orderBy[sortBy] = sortOrder;
  } else {
    orderBy.createdAt = 'desc';
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
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
      orderBy,
      skip,
      take,
    }),
    prisma.course.count({ where }),
  ]);

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

  if (sortBy === 'rating') {
    coursesWithRating.sort((a, b) => {
      const comparison = sortOrder === 'desc'
        ? b.averageRating - a.averageRating
        : a.averageRating - b.averageRating;
      return comparison;
    });
  }

  return {
    courses: coursesWithRating,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
}

export async function getCourseBySlug(slug: string) {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          avatar: true,
          creatorProfile: true,
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
      tags: {
        include: {
          tag: true,
        },
      },
      reviews: {
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
        take: 10,
      },
      _count: {
        select: {
          enrollments: true,
          reviews: true,
        },
      },
    },
  });

  if (!course) {
    throw new NotFoundError('Course');
  }

  const ratingAgg = await prisma.courseReview.aggregate({
    where: { courseId: course.id },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const averageRating = ratingAgg._avg.rating || 0;

  return {
    ...course,
    averageRating: Math.round(averageRating * 10) / 10,
    reviewCount: ratingAgg._count.rating,
  };
}

export async function getCourseById(id: string, userId: string) {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          avatar: true,
          creatorProfile: true,
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
      tags: {
        include: {
          tag: true,
        },
      },
      _count: {
        select: {
          enrollments: true,
          reviews: true,
        },
      },
    },
  });

  if (!course) {
    throw new NotFoundError('Course');
  }

  if (course.creatorId !== userId) {
    throw new ForbiddenError('You can only view your own courses');
  }

  const ratingAgg = await prisma.courseReview.aggregate({
    where: { courseId: course.id },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const averageRating = ratingAgg._avg.rating || 0;

  return {
    ...course,
    averageRating: Math.round(averageRating * 10) / 10,
    reviewCount: ratingAgg._count.rating,
  };
}

export async function getCreatorCourses(userId: string, status?: string) {
  const where: any = { creatorId: userId };
  if (status) {
    where.status = status;
  }

  const courses = await prisma.course.findMany({
    where,
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

  return coursesWithRating;
}

export async function createCourse(userId: string, body: z.infer<typeof createCourseSchema>) {
  const parsed = createCourseSchema.parse(body);

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new BadRequestError('User not found');
  }

  const creatorProfile = await prisma.creatorProfile.findUnique({
    where: { userId },
  });
  if (!creatorProfile) {
    await prisma.creatorProfile.create({
      data: {
        userId,
        bio: '',
        socialLinks: {},
        followersCount: 0,
        studentsCount: 0,
        totalRevenue: 0,
        averageRating: 0,
      },
    });
  }

  const category = await prisma.courseCategory.findUnique({
    where: { id: parsed.categoryId },
  });
  if (!category) {
    throw new BadRequestError('Category not found');
  }

  if (parsed.tags && parsed.tags.length > 0) {
    const tagCount = await prisma.courseTag.count({
      where: { id: { in: parsed.tags } },
    });
    if (tagCount !== parsed.tags.length) {
      throw new BadRequestError('One or more tags not found');
    }
  }

  const slug = parsed.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const existingCourse = await prisma.course.findUnique({
    where: { slug },
  });

  if (existingCourse) {
    throw new BadRequestError('Course with this title already exists');
  }

  const courseLevel = (parsed.level || 'BEGINNER') as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  if (!validLevels.includes(courseLevel)) {
    throw new BadRequestError(`Invalid level: ${courseLevel}`);
  }

  const course = await prisma.course.create({
    data: {
      creator: {
        connect: { id: userId },
      },
      category: {
        connect: { id: parsed.categoryId },
      },
      title: parsed.title,
      slug,
      subtitle: parsed.subtitle || null,
      description: parsed.description,
      thumbnail: parsed.thumbnail || null,
      price: parsed.price || 0,
      discountPrice: parsed.discountPrice || null,
      level: courseLevel,
      language: parsed.language || 'English',
      requirements: parsed.requirements || [],
      whatYouWillLearn: parsed.whatYouWillLearn || [],
      targetAudience: parsed.targetAudience || [],
      status: 'DRAFT',
      visibility: false,
    },
    include: {
      category: true,
    },
  });

  if (parsed.tags && parsed.tags.length > 0) {
    await prisma.courseTagRelation.createMany({
      data: parsed.tags.map((tagId: string) => ({
        courseId: course.id,
        tagId,
      })),
    });
  }

  return course;
}

export async function updateCourse(userId: string, id: string, body: z.infer<typeof updateCourseSchema>) {
  const parsed = updateCourseSchema.parse(body);

  const course = await prisma.course.findUnique({
    where: { id },
  });

  if (!course) {
    throw new NotFoundError('Course');
  }

  if (course.creatorId !== userId) {
    throw new ForbiddenError('You can only edit your own courses');
  }

  let slug = course.slug;
  if (parsed.title && parsed.title !== course.title) {
    slug = parsed.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  const updatedCourse = await prisma.course.update({
    where: { id },
    data: {
      ...(parsed.categoryId && { categoryId: parsed.categoryId }),
      ...(parsed.title && { title: parsed.title, slug }),
      ...(parsed.subtitle !== undefined && { subtitle: parsed.subtitle }),
      ...(parsed.description && { description: parsed.description }),
      ...(parsed.thumbnail !== undefined && { thumbnail: parsed.thumbnail }),
      ...(parsed.price !== undefined && { price: parsed.price }),
      ...(parsed.discountPrice !== undefined && { discountPrice: parsed.discountPrice }),
      ...(parsed.level && { level: parsed.level }),
      ...(parsed.language && { language: parsed.language }),
      ...(parsed.duration !== undefined && { duration: parsed.duration }),
      ...(parsed.status && { status: parsed.status }),
      ...(parsed.visibility !== undefined && { visibility: parsed.visibility }),
      ...(parsed.requirements !== undefined && { requirements: parsed.requirements }),
      ...(parsed.whatYouWillLearn !== undefined && { whatYouWillLearn: parsed.whatYouWillLearn }),
      ...(parsed.targetAudience !== undefined && { targetAudience: parsed.targetAudience }),
    },
    include: {
      category: true,
    },
  });

  if (parsed.status === 'PUBLISHED' && course.status !== 'PUBLISHED') {
    await awardExp(userId, 'COURSE_PUBLISH', `Published course: ${updatedCourse.title}`);
  }

  return updatedCourse;
}

export async function deleteCourse(userId: string, id: string) {
  const course = await prisma.course.findUnique({
    where: { id },
  });

  if (!course) {
    throw new NotFoundError('Course');
  }

  if (course.creatorId !== userId) {
    throw new ForbiddenError('You can only delete your own courses');
  }

  const enrollmentCount = await prisma.enrollment.count({
    where: { courseId: id },
  });

  if (enrollmentCount > 0) {
    throw new BadRequestError('Cannot delete course with active enrollments');
  }

  await prisma.course.delete({
    where: { id },
  });
}

export async function getCategories() {
  const categories = await prisma.courseCategory.findMany({
    orderBy: { order: 'asc' },
    include: {
      _count: {
        select: {
          courses: {
            where: { status: 'PUBLISHED' },
          },
        },
      },
    },
  });

  return categories;
}

export async function getTags() {
  const tags = await prisma.courseTag.findMany({
    orderBy: { name: 'asc' },
  });

  return tags;
}
