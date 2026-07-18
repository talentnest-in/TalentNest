import { prisma } from './src/lib/prisma';
import { checkAndAwardProfileCompletion } from './src/services/gamification.service';

async function main() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    await checkAndAwardProfileCompletion(user.id);
  }
  console.log('Retroactive profile sync complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
