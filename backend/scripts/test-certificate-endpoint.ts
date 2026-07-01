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
  console.log('=== CERTIFICATE ENDPOINT TEST ===\n');

  const currentUserId = '5285e861-453f-46aa-94b2-9d0ab77f7902'; // praveen

  // Get user's certificate
  const certificate = await prisma.certificate.findFirst({
    where: {
      enrollment: {
        studentId: currentUserId,
      },
    },
    include: {
      enrollment: {
        include: {
          course: true,
          student: true,
        },
      },
    },
  });

  if (!certificate) {
    console.log('No certificate found for current user.');
    return;
  }

  console.log('Test Certificate Found:');
  console.log('---');
  console.log(`Certificate ID: ${certificate.id}`);
  console.log(`Certificate ID (display): ${certificate.certificateId}`);
  console.log(`Verification Code: ${certificate.verificationCode}`);
  console.log(`Course: ${certificate.enrollment.course.title}`);
  console.log(`Student: ${certificate.enrollment.student.name}`);
  console.log('');

  // Test 1: Valid certificate ID for owner
  console.log('TEST 1: Valid certificate ID for owner');
  console.log(`URL: GET /api/v1/certificates/${certificate.id}`);
  console.log(`Expected: 200 OK with full certificate data`);
  console.log('');

  // Test 2: Non-existent certificate ID
  const fakeId = '00000000-0000-0000-0000-000000000000';
  console.log('TEST 2: Non-existent certificate ID');
  console.log(`URL: GET /api/v1/certificates/${fakeId}`);
  console.log(`Expected: 404 Not Found`);
  console.log('');

  // Test 3: Certificate ID belonging to different user
  const otherCertificate = await prisma.certificate.findFirst({
    where: {
      enrollment: {
        studentId: {
          not: currentUserId,
        },
      },
    },
    include: {
      enrollment: true,
    },
  });

  if (otherCertificate) {
    console.log('TEST 3: Certificate ID belonging to different user');
    console.log(`URL: GET /api/v1/certificates/${otherCertificate.id}`);
    console.log(`Owner: ${otherCertificate.enrollment.studentId}`);
    console.log(`Current User: ${currentUserId}`);
    console.log(`Expected: 403 Forbidden`);
    console.log('');
  } else {
    console.log('TEST 3: Skipped - no certificate found for other user');
    console.log('');
  }

  console.log('=== ENDPOINT CONFIGURATION ===');
  console.log('Route: GET /api/v1/certificates/:id');
  console.log('Auth: Required (fastify.authenticate)');
  console.log('Authorization: Checks enrollment.studentId === user.id');
  console.log('Response: Full certificate with enrollment, course, creator, student');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
