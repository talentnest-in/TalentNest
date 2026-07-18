import { prisma } from '../lib/prisma';
import { uploadFile } from '../lib/upload';
import { deleteFromCloudinary } from '../lib/cloudinary';
import { z } from 'zod';

const profileSchema = z.object({
  bio: z.string().nullable().catch(null),
  website: z.string().nullable().catch(null),
  location: z.string().nullable().catch(null),
});

async function getOrCreateClientProfile(userId: string) {
  return prisma.clientProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function getClientProfile(userId: string) {
  return prisma.clientProfile.findUnique({
    where: { userId },
    include: { company: true },
  });
}

export async function updateClientProfile(userId: string, body: unknown) {
  const data = profileSchema.parse(body);
  return prisma.clientProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
    include: { company: true },
  });
}

export async function uploadClientLogo(userId: string, logoUrl: string) {
  const existingProfile = await prisma.clientProfile.findUnique({
    where: { userId },
  });

  if (existingProfile?.logoUrl) {
    try {
      const urlParts = existingProfile.logoUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      if (filename) {
        const publicId = `talentnest/company-logos/${filename.split('.')[0]}`;
        await deleteFromCloudinary(publicId);
      }
    } catch (err) {
      console.warn('Failed to delete old logo from Cloudinary');
    }
  }

  return prisma.clientProfile.upsert({
    where: { userId },
    create: { userId, logoUrl },
    update: { logoUrl },
  });
}

export async function getClientDashboard(userId: string) {
  const profile = await prisma.clientProfile.findUnique({
    where: { userId },
    include: {
      company: true,
      jobs: {
        orderBy: { createdAt: 'desc' },
        include: { skills: true },
      },
    },
  });

  if (!profile) {
    return {
      activeJobs: 0,
      draftJobs: 0,
      totalJobs: 0,
      closedJobs: 0,
      recentJobs: [],
      company: null,
    };
  }

  const { jobs, company } = profile;
  const activeJobs = jobs.filter((j) => j.status === 'OPEN').length;
  const draftJobs = jobs.filter((j) => j.status === 'DRAFT').length;
  const closedJobs = jobs.filter((j) => j.status === 'CLOSED' || j.status === 'PAUSED').length;

  return {
    activeJobs,
    draftJobs,
    totalJobs: jobs.length,
    closedJobs,
    recentJobs: jobs.slice(0, 5),
    company,
  };
}
