import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL as string;

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const lessonId = '99616298-c95f-42ad-b17e-a22f6973bfa8';
  const quizId = '4813910a-246d-4047-a2c5-8e6ecefff82f';
  const studentId = '5d2e8c06-f229-4275-a1d8-aa9cc27f9e79';

  console.log('STEP 1: Identify courseId for lesson and quiz');
  
  // Get courseId from lesson
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      section: {
        select: {
          courseId: true,
        },
      },
    },
  });

  if (!lesson) {
    console.error('Lesson not found:', lessonId);
    return;
  }

  const lessonCourseId = lesson.section.courseId;
  console.log('Lesson courseId:', lessonCourseId);

  // Get courseId from quiz
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      lesson: {
        include: {
          section: {
            select: {
              courseId: true,
            },
          },
        },
      },
    },
  });

  if (!quiz) {
    console.error('Quiz not found:', quizId);
    return;
  }

  const quizCourseId = quiz.lesson.section.courseId;
  console.log('Quiz courseId:', quizCourseId);

  if (lessonCourseId !== quizCourseId) {
    console.error('ERROR: Lesson and quiz belong to different courses!');
    console.log('Lesson course:', lessonCourseId);
    console.log('Quiz course:', quizCourseId);
    return;
  }

  console.log('✓ Both lesson and quiz belong to the same course:', lessonCourseId);

  console.log('\nSTEP 2: Check existing enrollment');
  
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId: lessonCourseId,
        studentId: studentId,
      },
    },
  });

  if (existingEnrollment) {
    console.log('Enrollment already exists:', existingEnrollment);
    return;
  }

  console.log('No existing enrollment found. Creating...');

  console.log('\nSTEP 3: Create the enrollment record');
  
  const enrollment = await prisma.enrollment.create({
    data: {
      courseId: lessonCourseId,
      studentId: studentId,
      status: 'ACTIVE',
      progress: 0,
    },
  });

  console.log('✓ Enrollment created:', enrollment);

  console.log('\nSTEP 4: Verify enrollment');
  
  const verifiedEnrollment = await prisma.enrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId: lessonCourseId,
        studentId: studentId,
      },
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
        },
      },
      student: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  console.log('Verified enrollment:', JSON.stringify(verifiedEnrollment, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
