import { prisma } from './src/lib/prisma';

async function main() {
  console.log('Deleting all users...');
  const result = await prisma.user.deleteMany({});
  console.log(`Deleted ${result.count} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
