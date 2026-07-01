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
  const lessonId = '935e9227-8ed9-4f51-b1bc-b5009a6ca2dc';
  const userId = '5285e861-453f-46aa-94b2-9d0ab77f7902';

  console.log('=== LESSON ENROLLMENT CHECK ===\n');
  console.log(`Lesson ID: ${lessonId}`);
  console.log(`User ID: ${userId}\n`);

  // Step 1: Find the Course that owns this Lesson
  console.log('STEP 1: Finding Course for Lesson...\n');

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      section: {
        include: {
          course: true,
        },
      },
    },
  });

  if (!lesson) {
    console.log('❌ Lesson not found in database.');
    return;
  }

  const course = lesson.section.course;
  console.log('✅ Lesson found');
  console.log(`Course ID: ${course.id}`);
  console.log(`Course Title: ${course.title}`);
  console.log(`Course Slug: ${course.slug}\n`);

  // Step 2: Check whether this user has an Enrollment for that Course
  console.log('STEP 2: Checking Enrollment...\n');

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId: course.id,
        studentId: userId,
      },
    },
  });

  if (!enrollment) {
    console.log('❌ No Enrollment found for this user in this course.');
    console.log('');
    console.log('CONCLUSION:');
    console.log('- This is a DATA issue, not a code issue.');
    console.log('- The user is not enrolled in the course.');
    console.log('- Authorization logic should correctly reject this user.');
    console.log('- DO NOT modify authorization logic.');
    return;
  }

  console.log('✅ Enrollment found');
  console.log(`Enrollment ID: ${enrollment.id}`);
  console.log(`Enrollment Status: ${enrollment.status}`);
  console.log(`Progress: ${enrollment.progress}%`);
  console.log(`Enrolled At: ${enrollment.enrolledAt}\n`);

  // Step 3: If Enrollment exists, trace authorization logic
  console.log('STEP 3: Tracing Authorization Logic...\n');
  console.log('Since the user IS enrolled, we need to check authorization logic.');
  console.log('');
  console.log('Authorization checks that should pass:');
  console.log(`1. User is authenticated: ✅ (${userId})`);
  console.log(`2. User is enrolled in course: ✅ (Enrollment ID: ${enrollment.id})`);
  console.log(`3. Enrollment status: ${enrollment.status}`);
  console.log('');

  // Check lesson progress
  const lessonProgress = await prisma.lessonProgress.findUnique({
    where: {
      enrollmentId_lessonId: {
        enrollmentId: enrollment.id,
        lessonId: lessonId,
      },
    },
  });

  if (lessonProgress) {
    console.log(`Lesson Progress: ${lessonProgress.completed ? 'Completed' : 'Not completed'}`);
  } else {
    console.log('Lesson Progress: No progress record found');
  }

  console.log('');
  console.log('CONCLUSION:');
  console.log('- User IS enrolled in the course.');
  console.log('- If authorization is failing, check the specific endpoint logic.');
  console.log('- Review the authorization check in the relevant controller.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
