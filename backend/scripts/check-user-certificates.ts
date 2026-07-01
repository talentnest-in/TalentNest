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
  const currentUserId = '5285e861-453f-46aa-94b2-9d0ab77f7902'; // praveen (current logged-in user)

  console.log('=== CURRENT USER CERTIFICATES ===\n');
  console.log('User ID:', currentUserId);
  console.log('');

  const certificates = await prisma.certificate.findMany({
    where: {
      enrollment: {
        studentId: currentUserId,
      },
    },
    include: {
      enrollment: {
        include: {
          course: true,
        },
      },
    },
    orderBy: { issuedAt: 'desc' },
  });

  console.log(`Total certificates for user: ${certificates.length}\n`);

  if (certificates.length === 0) {
    console.log('No certificates found for current user.');
  } else {
    certificates.forEach((cert) => {
      console.log('---');
      console.log(`Certificate ID: ${cert.id}`);
      console.log(`Certificate ID (display): ${cert.certificateId}`);
      console.log(`Verification Code: ${cert.verificationCode}`);
      console.log(`Issued At: ${cert.issuedAt}`);
      console.log(`Enrollment ID: ${cert.enrollmentId}`);
      console.log(`Course: ${cert.enrollment.course.title}`);
      console.log(`Course ID: ${cert.enrollment.course.id}`);
      console.log(`Course Slug: ${cert.enrollment.course.slug}`);
      console.log(`Enrollment Status: ${cert.enrollment.status}`);
      console.log(`Enrollment Progress: ${cert.enrollment.progress}%`);
    });
  }

  // Check what the frontend would receive from GET /certificates
  console.log('\n=== FRONTEND API RESPONSE SIMULATION ===\n');
  console.log('GET /api/v1/certificates would return:');
  console.log(JSON.stringify(certificates, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
