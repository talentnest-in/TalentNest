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

  console.log('Checking lesson:', lessonId);
  
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      quiz: true,
      section: {
        select: {
          courseId: true,
          title: true,
        },
      },
    },
  });

  if (!lesson) {
    console.error('Lesson not found');
    return;
  }

  console.log('Lesson:', lesson.title);
  console.log('Section:', lesson.section.title);
  console.log('Has quiz:', lesson.quiz ? 'YES' : 'NO');
  
  if (lesson.quiz) {
    console.log('Quiz details:', {
      id: lesson.quiz.id,
      title: lesson.quiz.title,
      questionCount: lesson.quiz.questions?.length || 0,
    });
  } else {
    console.log('This lesson does not have a quiz attached.');
    
    // Find lessons in this course that DO have quizzes
    const lessonsWithQuizzes = await prisma.lesson.findMany({
      where: {
        section: {
          courseId: lesson.section.courseId,
        },
        quiz: {
          isNot: null,
        },
      },
      include: {
        quiz: true,
        section: {
          select: {
            title: true,
          },
        },
      },
    });

    console.log('\nLessons with quizzes in this course:');
    lessonsWithQuizzes.forEach(l => {
      console.log(`- ${l.title} (Section: ${l.section.title})`);
      console.log(`  Quiz: ${l.quiz?.title}`);
    });
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
