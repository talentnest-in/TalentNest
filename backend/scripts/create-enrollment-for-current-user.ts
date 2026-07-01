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
  const lessonId = process.argv[2];
  const currentUserId = '5285e861-453f-46aa-94b2-9d0ab77f7902'; // praveen (current logged-in user)

  if (!lessonId) {
    console.error('Usage: npx tsx scripts/create-enrollment-for-current-user.ts <lessonId>');
    process.exit(1);
  }

  console.log('Finding courseId for lesson:', lessonId);
  
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
    process.exit(1);
  }

  const courseId = lesson.section.courseId;
  console.log('CourseId:', courseId);
  console.log('Current userId:', currentUserId);

  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId,
        studentId: currentUserId,
      },
    },
  });

  if (existingEnrollment) {
    console.log('Enrollment already exists for current user');
    console.log('Enrollment:', existingEnrollment);
    return;
  }

  console.log('Creating enrollment for current user...');
  
  const enrollment = await prisma.enrollment.create({
    data: {
      courseId,
      studentId: currentUserId,
      status: 'ACTIVE',
      progress: 0,
    },
  });

  console.log('✓ Enrollment created:', enrollment);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
