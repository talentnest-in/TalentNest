const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const missions = await prisma.mission.findMany();
  console.log("Missions:", missions);
  const progress = await prisma.missionProgress.findMany();
  console.log("Progress:", progress);
}

check().catch(console.error).finally(() => prisma.$disconnect());
