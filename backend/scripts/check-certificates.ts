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
  console.log('=== CERTIFICATE DATABASE CHECK ===\n');

  // Check all certificates
  const allCertificates = await prisma.certificate.findMany({
    include: {
      enrollment: {
        include: {
          course: true,
          student: true,
        },
      },
    },
  });

  console.log(`Total certificates in database: ${allCertificates.length}\n`);

  if (allCertificates.length === 0) {
    console.log('No certificates found in database.');
  } else {
    allCertificates.forEach((cert) => {
      console.log('---');
      console.log(`Certificate ID: ${cert.id}`);
      console.log(`Certificate ID (display): ${cert.certificateId}`);
      console.log(`Verification Code: ${cert.verificationCode}`);
      console.log(`Issued At: ${cert.issuedAt}`);
      console.log(`Enrollment ID: ${cert.enrollmentId}`);
      console.log(`Course: ${cert.enrollment.course.title}`);
      console.log(`Student: ${cert.enrollment.student.name}`);
      console.log(`Enrollment Status: ${cert.enrollment.status}`);
      console.log(`Enrollment Progress: ${cert.enrollment.progress}%`);
    });
  }

  // Check enrollments that might need certificates
  console.log('\n=== ENROLLMENTS THAT MIGHT NEED CERTIFICATES ===\n');

  const completedEnrollments = await prisma.enrollment.findMany({
    where: {
      status: 'COMPLETED',
    },
    include: {
      course: {
        include: {
          sections: {
            include: {
              lessons: true,
            },
          },
        },
      },
      student: true,
    },
  });

  console.log(`Total completed enrollments: ${completedEnrollments.length}\n`);

  for (const enrollment of completedEnrollments) {
    const hasCertificate = await prisma.certificate.findUnique({
      where: { enrollmentId: enrollment.id },
    });

    console.log('---');
    console.log(`Enrollment ID: ${enrollment.id}`);
    console.log(`Course: ${enrollment.course.title}`);
    console.log(`Student: ${enrollment.student.name}`);
    console.log(`Progress: ${enrollment.progress}%`);
    console.log(`Has Certificate: ${hasCertificate ? 'YES' : 'NO'}`);

    if (!hasCertificate) {
      // Count total lessons
      let totalLessons = 0;
      enrollment.course.sections.forEach((section) => {
        totalLessons += section.lessons.length;
      });

      // Check lesson progress
      const lessonProgress = await prisma.lessonProgress.findMany({
        where: { enrollmentId: enrollment.id },
      });

      const completedLessons = lessonProgress.filter((lp) => lp.completed).length;

      console.log(`Total Lessons: ${totalLessons}`);
      console.log(`Completed Lessons: ${completedLessons}`);

      // Check for quizzes
      const lessonsWithQuizzes = enrollment.course.sections.flatMap((section) =>
        section.lessons.filter((lesson) => lesson.type === 'QUIZ')
      );

      console.log(`Lessons with Quizzes: ${lessonsWithQuizzes.length}`);

      if (lessonsWithQuizzes.length > 0) {
        for (const lesson of lessonsWithQuizzes) {
          const quiz = await prisma.quiz.findUnique({
            where: { lessonId: lesson.id },
          });

          if (quiz) {
            const attempts = await prisma.quizAttempt.findMany({
              where: {
                quizId: quiz.id,
                enrollmentId: enrollment.id,
              },
            });

            const passedAttempts = attempts.filter((a) => a.passed);
            console.log(`  Quiz: ${quiz.title} - Attempts: ${attempts.length} - Passed: ${passedAttempts.length > 0 ? 'YES' : 'NO'}`);
          }
        }
      }
    }
  }

  // Check current user's enrollments
  console.log('\n=== CURRENT USER ENROLLMENTS ===\n');

  const currentUserId = '5285e861-453f-46aa-94b2-9d0ab77f7902'; // praveen

  const userEnrollments = await prisma.enrollment.findMany({
    where: {
      studentId: currentUserId,
    },
    include: {
      course: true,
    },
  });

  console.log(`User enrollments: ${userEnrollments.length}\n`);

  for (const enrollment of userEnrollments) {
    const hasCertificate = await prisma.certificate.findUnique({
      where: { enrollmentId: enrollment.id },
    });

    console.log('---');
    console.log(`Course: ${enrollment.course.title}`);
    console.log(`Status: ${enrollment.status}`);
    console.log(`Progress: ${enrollment.progress}%`);
    console.log(`Has Certificate: ${hasCertificate ? 'YES' : 'NO'}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
