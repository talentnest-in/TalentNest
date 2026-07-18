import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  var prisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL as string;

// Configure the pool for production workloads
const pool = new Pool({
  connectionString,
  max: 20,              // max pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Handle pool errors to prevent unhandled rejections
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

const adapter = new PrismaPg(pool);
export const prisma = global.prisma ?? new PrismaClient({ adapter });

// Prevent multiple instances in dev (Next.js / tsx hot-reload)
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

// Graceful shutdown: release DB connections
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  await pool.end();
  process.exit(0);
});
