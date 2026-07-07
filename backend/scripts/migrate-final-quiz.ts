import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function migrateFinalQuiz() {
  console.log('Starting migration: Set isFinal=true on last quiz per course...');

  try {
    // Get all courses
    const courses = await prisma.course.findMany({
      include: {
        sections: {
          include: {
            lessons: {
              include: {
                quiz: true,
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    let updatedCount = 0;

    for (const course of courses) {
      // Get all lessons with quizzes in order
      const lessonsWithQuizzes = course.sections
        .flatMap(s => s.lessons)
        .filter(l => l.quiz)
        .sort((a, b) => a.order - b.order);

      if (lessonsWithQuizzes.length === 0) {
        console.log(`Course ${course.id} (${course.title}): No quizzes found, skipping`);
        continue;
      }

      // Get the last quiz (highest order)
      const lastLessonWithQuiz = lessonsWithQuizzes[lessonsWithQuizzes.length - 1];
      const lastQuiz = lastLessonWithQuiz.quiz!;

      // Update isFinal to true
      await prisma.quiz.update({
        where: { id: lastQuiz.id },
        data: { isFinal: true },
      });

      updatedCount++;
      console.log(`Course ${course.id} (${course.title}): Set isFinal=true on quiz ${lastQuiz.id}`);
    }

    console.log(`\nMigration complete: Updated ${updatedCount} quizzes to isFinal=true`);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateFinalQuiz()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
