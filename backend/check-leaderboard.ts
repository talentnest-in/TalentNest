import { prisma } from './src/lib/prisma';
prisma.leaderboard.findMany().then(d => {
  console.log(JSON.stringify(d, null, 2));
}).finally(() => prisma.$disconnect());
