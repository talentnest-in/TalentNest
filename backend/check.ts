import { prisma } from './src/lib/prisma';

async function check() {
  const missions = await prisma.mission.findMany({ include: { missionProgresses: true } });
  console.log("Missions:", JSON.stringify(missions, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
