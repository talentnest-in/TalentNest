import { z } from 'zod';

export const uuidParam = z.string().uuid('Invalid UUID format');

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const contractIdParam = z.object({
  contractId: z.string().uuid('Invalid contract ID'),
});

export const postIdParam = z.object({
  postId: z.string().uuid('Invalid post ID'),
});

export const courseIdParam = z.object({
  courseId: z.string().uuid('Invalid course ID'),
});

export const enrollmentIdParam = z.object({
  enrollmentId: z.string().uuid('Invalid enrollment ID'),
});

export const sectionIdParam = z.object({
  sectionId: z.string().uuid('Invalid section ID'),
});

export const lessonIdParam = z.object({
  lessonId: z.string().uuid('Invalid lesson ID'),
});

export const jobIdParam = z.object({
  id: z.string().uuid('Invalid job ID'),
});

export const applicationIdParam = z.object({
  id: z.string().uuid('Invalid application ID'),
});

export const offerIdParam = z.object({
  id: z.string().uuid('Invalid offer ID'),
});

export const notificationIdParam = z.object({
  id: z.string().uuid('Invalid notification ID'),
});

export const reviewIdParam = z.object({
  reviewId: z.string().uuid('Invalid review ID'),
});

export const communityIdParam = z.object({
  id: z.string().uuid('Invalid community ID'),
});

export const contestIdParam = z.object({
  id: z.string().uuid('Invalid contest ID'),
});

export const submissionIdParam = z.object({
  submissionId: z.string().uuid('Invalid submission ID'),
});

export const userIdParam = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export const creatorIdParam = z.object({
  creatorId: z.string().uuid('Invalid creator ID'),
});

export const badgeIdParam = z.object({
  badgeId: z.string().uuid('Invalid badge ID'),
});

export const missionIdParam = z.object({
  missionId: z.string().uuid('Invalid mission ID'),
});

export const payoutIdParam = z.object({
  payoutId: z.string().uuid('Invalid payout ID'),
});

export const reportIdParam = z.object({
  reportId: z.string().uuid('Invalid report ID'),
});

export const postReportIdParam = z.object({
  postId: z.string().uuid('Invalid post ID'),
});
