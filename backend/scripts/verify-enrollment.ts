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
  const lessonId = '41e5ce63-9412-4c52-9d06-553329561cbe';
  const studentId = '5d2e8c06-f229-4275-a1d8-aa9cc27f9e79';

  console.log('STEP 1: Get courseId from lesson');
  
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

  const courseId = lesson.section.courseId;
  console.log('CourseId:', courseId);

  console.log('\nSTEP 2: Check enrollment using unique constraint');
  
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId,
        studentId,
      },
    },
  });

  if (!enrollment) {
    console.error('❌ Enrollment NOT found using unique constraint');
    console.log('Looking for:', { courseId, studentId });
    
    // Try to find ANY enrollment for this student
    const allEnrollments = await prisma.enrollment.findMany({
      where: { studentId },
    });
    console.log('All enrollments for this student:', allEnrollments.length);
    allEnrollments.forEach(e => console.log('  -', e.courseId, e.status));
    
    // Try to find ANY enrollment for this course
    const courseEnrollments = await prisma.enrollment.findMany({
      where: { courseId },
    });
    console.log('All enrollments for this course:', courseEnrollments.length);
    courseEnrollments.forEach(e => console.log('  -', e.studentId, e.status));
  } else {
    console.log('✓ Enrollment found:', enrollment);
  }

  console.log('\nSTEP 3: Verify lesson exists and belongs to course');
  console.log('Lesson:', lesson.id, '→ Section:', lesson.sectionId, '→ Course:', courseId);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
