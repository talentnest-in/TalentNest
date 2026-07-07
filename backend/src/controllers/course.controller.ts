import { FastifyRequest, FastifyReply } from 'fastify';
import { uploadToCloudinary } from '../lib/cloudinary';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

// Validation schemas
const createCourseSchema = {
  type: 'object',
  properties: {
    categoryId: { type: 'string' },
    title: { type: 'string' },
    subtitle: { type: 'string' },
    description: { type: 'string' },
    price: { type: 'number' },
    discountPrice: { type: 'number' },
    level: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
    language: { type: 'string' },
    requirements: { type: 'array', items: { type: 'string' } },
    whatYouWillLearn: { type: 'array', items: { type: 'string' } },
    targetAudience: { type: 'array', items: { type: 'string' } },
    tags: { type: 'array', items: { type: 'string' } },
    thumbnail: { type: 'string' },
  },
  required: ['categoryId', 'title', 'description'],
};

const updateCourseSchema = {
  type: 'object',
  properties: {
    categoryId: { type: 'string' },
    title: { type: 'string' },
    subtitle: { type: 'string' },
    description: { type: 'string' },
    thumbnail: { type: 'string' },
    price: { type: 'number' },
    discountPrice: { type: 'number' },
    level: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
    language: { type: 'string' },
    duration: { type: 'number' },
    status: { type: 'string', enum: ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED'] },
    visibility: { type: 'boolean' },
    requirements: { type: 'array', items: { type: 'string' } },
    whatYouWillLearn: { type: 'array', items: { type: 'string' } },
    targetAudience: { type: 'array', items: { type: 'string' } },
  },
};

export const courseController = {
  // Get all courses (marketplace)
  async getAllCourses(request: FastifyRequest, reply: FastifyReply) {
    try {
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
        limit = '20'
      } = request.query as any;

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
      // Only allow sorting by valid Course fields
      const validSortFields = ['createdAt', 'updatedAt', 'title', 'price', 'level'];
      if (validSortFields.includes(sortBy)) {
        orderBy[sortBy] = sortOrder;
      } else {
        // Default to createdAt for invalid sort fields
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

      // Calculate average rating for each course
      const coursesWithRating = await Promise.all(
        courses.map(async (course) => {
          const reviews = await prisma.courseReview.findMany({
            where: { courseId: course.id },
            select: { rating: true },
          });
          const avgRating = reviews.length 
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
            : 0;
          return {
            ...course,
            averageRating: Math.round(avgRating * 10) / 10,
            reviewCount: reviews.length,
          };
        })
      );

      // Sort by rating if requested (after calculation)
      if (sortBy === 'rating') {
        coursesWithRating.sort((a, b) => {
          const comparison = sortOrder === 'desc' 
            ? b.averageRating - a.averageRating 
            : a.averageRating - b.averageRating;
          return comparison;
        });
      }

      return reply.send({
        courses: coursesWithRating,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      request.log.error(error, 'Failed to fetch courses');
      return reply.status(500).send({ error: 'Failed to fetch courses' });
    }
  },

  // Get course by slug
  async getCourseBySlug(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { slug } = request.params as { slug: string };

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
        return reply.status(404).send({ error: 'Course not found' });
      }

      // Calculate average rating
      const allReviews = await prisma.courseReview.findMany({
        where: { courseId: course.id },
        select: { rating: true },
      });
      const averageRating = allReviews.length 
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length 
        : 0;

      return reply.send({
        ...course,
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: allReviews.length,
      });
    } catch (error) {
      request.log.error(error, 'Failed to fetch course');
      return reply.status(500).send({ error: 'Failed to fetch course' });
    }
  },

  // Get course by ID (for creator editing)
  async getCourseById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const userId = (request as any).user.id;

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
        return reply.status(404).send({ error: 'Course not found' });
      }

      // Check if user is the creator
      if (course.creatorId !== userId) {
        return reply.status(403).send({ error: 'You can only view your own courses' });
      }

      // Calculate average rating
      const allReviews = await prisma.courseReview.findMany({
        where: { courseId: course.id },
        select: { rating: true },
      });
      const averageRating = allReviews.length 
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length 
        : 0;

      return reply.send({
        ...course,
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: allReviews.length,
      });
    } catch (error) {
      request.log.error(error, 'Failed to fetch course');
      return reply.status(500).send({ error: 'Failed to fetch course' });
    }
  },

  // Get creator's courses
  async getCreatorCourses(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { status } = request.query as any;

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

      // Calculate average rating for each course
      const coursesWithRating = await Promise.all(
        courses.map(async (course) => {
          const reviews = await prisma.courseReview.findMany({
            where: { courseId: course.id },
            select: { rating: true },
          });
          const avgRating = reviews.length 
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
            : 0;
          return {
            ...course,
            averageRating: Math.round(avgRating * 10) / 10,
            reviewCount: reviews.length,
          };
        })
      );

      return reply.send(coursesWithRating);
    } catch (error) {
      request.log.error(error, 'Failed to fetch creator courses');
      return reply.status(500).send({ error: 'Failed to fetch creator courses' });
    }
  },

  // Create course
  async createCourse(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const body = request.body as any;

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        return reply.status(400).send({ error: 'User not found' });
      }

      // Verify creator profile exists, create if not
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

      // Verify category exists
      const category = await prisma.courseCategory.findUnique({
        where: { id: body.categoryId },
      });
      if (!category) {
        return reply.status(400).send({ error: 'Category not found' });
      }

      // Verify tags exist
      if (body.tags && body.tags.length > 0) {
        const tagCount = await prisma.courseTag.count({
          where: { id: { in: body.tags } },
        });
        if (tagCount !== body.tags.length) {
          return reply.status(400).send({ error: 'One or more tags not found' });
        }
      }

      // Generate slug from title
      const slug = body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if slug already exists
      const existingCourse = await prisma.course.findUnique({
        where: { slug },
      });

      if (existingCourse) {
        return reply.status(400).send({ error: 'Course with this title already exists' });
      }

      // Prepare course data
      const courseData = {
        creator: {
          connect: { id: userId },
        },
        category: {
          connect: { id: body.categoryId },
        },
        title: body.title,
        slug,
        subtitle: body.subtitle || null,
        description: body.description,
        thumbnail: body.thumbnail || null,
        price: body.price || 0,
        discountPrice: body.discountPrice || null,
        level: (body.level || 'BEGINNER') as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
        language: body.language || 'English',
        requirements: body.requirements || [],
        whatYouWillLearn: body.whatYouWillLearn || [],
        targetAudience: body.targetAudience || [],
        status: 'DRAFT' as 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED',
        visibility: false,
      };

      const validLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
      if (!validLevels.includes(courseData.level)) {
        return reply.status(400).send({ error: `Invalid level: ${courseData.level}` });
      }

      const course = await prisma.course.create({
        data: courseData,
        include: {
          category: true,
        },
      });

      // Create tag relations if tags provided
      if (body.tags && body.tags.length > 0) {
        await prisma.courseTagRelation.createMany({
          data: body.tags.map((tagId: string) => ({
            courseId: course.id,
            tagId,
          })),
        });
      }

      return reply.status(201).send(course);
    } catch (error: any) {
      request.log.error(error, 'Failed to create course');
      return reply.status(500).send({ 
        error: 'Failed to create course',
        details: error.message,
      });
    }
  },

  // Update course
  async updateCourse(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const body = request.body as any;

      // Check if course exists and user is the creator
      const course = await prisma.course.findUnique({
        where: { id },
      });

      if (!course) {
        return reply.status(404).send({ error: 'Course not found' });
      }

      if (course.creatorId !== userId) {
        return reply.status(403).send({ error: 'You can only edit your own courses' });
      }

      // Update slug if title changed
      let slug = course.slug;
      if (body.title && body.title !== course.title) {
        slug = body.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }

      const updatedCourse = await prisma.course.update({
        where: { id },
        data: {
          ...(body.categoryId && { categoryId: body.categoryId }),
          ...(body.title && { title: body.title, slug }),
          ...(body.subtitle !== undefined && { subtitle: body.subtitle }),
          ...(body.description && { description: body.description }),
          ...(body.thumbnail !== undefined && { thumbnail: body.thumbnail }),
          ...(body.price !== undefined && { price: body.price }),
          ...(body.discountPrice !== undefined && { discountPrice: body.discountPrice }),
          ...(body.level && { level: body.level }),
          ...(body.language && { language: body.language }),
          ...(body.duration !== undefined && { duration: body.duration }),
          ...(body.status && { status: body.status }),
          ...(body.visibility !== undefined && { visibility: body.visibility }),
          ...(body.requirements !== undefined && { requirements: body.requirements }),
          ...(body.whatYouWillLearn !== undefined && { whatYouWillLearn: body.whatYouWillLearn }),
          ...(body.targetAudience !== undefined && { targetAudience: body.targetAudience }),
        },
        include: {
          category: true,
        },
      });

      return reply.send(updatedCourse);
    } catch (error) {
      request.log.error(error, 'Failed to update course');
      return reply.status(500).send({ error: 'Failed to update course' });
    }
  },

  // Upload course thumbnail
  async uploadThumbnail(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }

      // Check if course exists and user is the creator
      const course = await prisma.course.findUnique({
        where: { id },
      });

      if (!course) {
        return reply.status(404).send({ error: 'Course not found' });
      }

      if (course.creatorId !== userId) {
        return reply.status(403).send({ error: 'You can only edit your own courses' });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!data.mimetype || !allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send({ error: 'Invalid file type. Only JPG, PNG, WEBP allowed' });
      }

      const buffer = await data.toBuffer();

      // Upload to Cloudinary
      const result = await uploadToCloudinary(
        buffer,
        data.filename,
        data.mimetype,
        'talentnest/course-thumbnails'
      );

      // Update course thumbnail
      const updatedCourse = await prisma.course.update({
        where: { id },
        data: { thumbnail: result.secure_url },
      });

      return reply.send({ thumbnail: result.secure_url });
    } catch (error) {
      request.log.error(error, 'Failed to upload thumbnail');
      return reply.status(500).send({ error: 'Failed to upload thumbnail' });
    }
  },

  // Delete course
  async deleteCourse(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };

      // Check if course exists and user is the creator
      const course = await prisma.course.findUnique({
        where: { id },
      });

      if (!course) {
        return reply.status(404).send({ error: 'Course not found' });
      }

      if (course.creatorId !== userId) {
        return reply.status(403).send({ error: 'You can only delete your own courses' });
      }

      // Check if course has enrollments
      const enrollmentCount = await prisma.enrollment.count({
        where: { courseId: id },
      });

      if (enrollmentCount > 0) {
        return reply.status(400).send({ 
          error: 'Cannot delete course with active enrollments' 
        });
      }

      await prisma.course.delete({
        where: { id },
      });

      return reply.status(204).send();
    } catch (error) {
      request.log.error(error, 'Failed to delete course');
      return reply.status(500).send({ error: 'Failed to delete course' });
    }
  },

  // Get course categories
  async getCategories(request: FastifyRequest, reply: FastifyReply) {
    try {
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

      return reply.send(categories);
    } catch (error) {
      request.log.error(error, 'Failed to fetch categories');
      return reply.status(500).send({ error: 'Failed to fetch categories' });
    }
  },

  // Get course tags
  async getTags(request: FastifyRequest, reply: FastifyReply) {
    try {
      const tags = await prisma.courseTag.findMany({
        orderBy: { name: 'asc' },
      });

      return reply.send(tags);
    } catch (error) {
      request.log.error(error, 'Failed to fetch tags');
      return reply.status(500).send({ error: 'Failed to fetch tags' });
    }
  },
};
