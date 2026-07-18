import { LessonType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '../lib/errors';

export async function createSection(userId: string, courseId: string, body: { title: string; description?: string }) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new NotFoundError('Course');
  }

  if (course.creatorId !== userId) {
    throw new ForbiddenError('You can only edit your own courses');
  }

  const maxOrder = await prisma.courseSection.findFirst({
    where: { courseId },
    orderBy: { order: 'desc' },
  });

  const section = await prisma.courseSection.create({
    data: {
      courseId,
      title: body.title,
      description: body.description ?? null,
      order: (maxOrder?.order || 0) + 1,
    },
  });

  return section;
}

export async function updateSection(
  userId: string,
  sectionId: string,
  body: { title?: string; description?: string; order?: number }
) {
  const section = await prisma.courseSection.findUnique({
    where: { id: sectionId },
    include: { course: true },
  });

  if (!section) {
    throw new NotFoundError('Section');
  }

  if (section.course.creatorId !== userId) {
    throw new ForbiddenError('You can only edit your own courses');
  }

  const updatedSection = await prisma.courseSection.update({
    where: { id: sectionId },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.order !== undefined && { order: body.order }),
    },
  });

  return updatedSection;
}

export async function deleteSection(userId: string, sectionId: string) {
  const section = await prisma.courseSection.findUnique({
    where: { id: sectionId },
    include: { course: true },
  });

  if (!section) {
    throw new NotFoundError('Section');
  }

  if (section.course.creatorId !== userId) {
    throw new ForbiddenError('You can only edit your own courses');
  }

  await prisma.courseSection.delete({
    where: { id: sectionId },
  });
}

export async function createLesson(
  userId: string,
  sectionId: string,
  body: {
    title: string;
    description?: string;
    content?: string;
    videoUrl?: string;
    attachments?: string[];
    duration?: number;
    type?: string;
    isPreview?: boolean;
  }
) {
  const section = await prisma.courseSection.findUnique({
    where: { id: sectionId },
    include: { course: true },
  });

  if (!section) {
    throw new NotFoundError('Section');
  }

  if (section.course.creatorId !== userId) {
    throw new ForbiddenError('You can only edit your own courses');
  }

  const maxOrder = await prisma.lesson.findFirst({
    where: { sectionId },
    orderBy: { order: 'desc' },
  });

  const lesson = await prisma.lesson.create({
    data: {
      sectionId,
      title: body.title,
      description: body.description ?? null,
      content: body.content ?? null,
      videoUrl: body.videoUrl ?? null,
      attachments: body.attachments || [],
      duration: body.duration ?? null,
      type: (body.type || 'VIDEO') as LessonType,
      order: (maxOrder?.order || 0) + 1,
      isPreview: body.isPreview || false,
    },
  });

  return lesson;
}

export async function updateLesson(
  userId: string,
  lessonId: string,
  body: {
    title?: string;
    description?: string;
    content?: string;
    videoUrl?: string;
    attachments?: string[];
    duration?: number;
    type?: string;
    order?: number;
    isPreview?: boolean;
  }
) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      section: {
        include: { course: true },
      },
    },
  });

  if (!lesson) {
    throw new NotFoundError('Lesson');
  }

  if (lesson.section.course.creatorId !== userId) {
    throw new ForbiddenError('You can only edit your own courses');
  }

  const updatedLesson = await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.description !== undefined && { description: body.description ?? null }),
      ...(body.content !== undefined && { content: body.content ?? null }),
      ...(body.videoUrl !== undefined && { videoUrl: body.videoUrl }),
      ...(body.attachments !== undefined && { attachments: body.attachments }),
      ...(body.duration !== undefined && { duration: body.duration }),
      ...(body.type && { type: body.type as LessonType }),
      ...(body.order !== undefined && { order: body.order }),
      ...(body.isPreview !== undefined && { isPreview: body.isPreview }),
    },
  });

  return updatedLesson;
}

export async function deleteLesson(userId: string, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      section: {
        include: { course: true },
      },
    },
  });

  if (!lesson) {
    throw new NotFoundError('Lesson');
  }

  if (lesson.section.course.creatorId !== userId) {
    throw new ForbiddenError('You can only edit your own courses');
  }

  await prisma.lesson.delete({
    where: { id: lessonId },
  });
}

export async function reorderLessons(
  userId: string,
  sectionId: string,
  lessons: { id: string; order: number }[]
) {
  const section = await prisma.courseSection.findUnique({
    where: { id: sectionId },
    include: { course: true },
  });

  if (!section) {
    throw new NotFoundError('Section');
  }

  if (section.course.creatorId !== userId) {
    throw new ForbiddenError('You can only edit your own courses');
  }

  await Promise.all(
    lessons.map(({ id, order }) =>
      prisma.lesson.update({
        where: { id },
        data: { order },
      })
    )
  );

  return { success: true };
}
