import { prisma } from './src/lib/prisma';
import { updateLeaderboard } from './src/services/gamification.service';

async function main() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    console.log('Syncing leaderboard for user', user.id);
    await updateLeaderboard(user.id);
  }
  console.log('Leaderboard sync complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
