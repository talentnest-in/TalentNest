import { prisma } from '../lib/prisma';
import { deleteFromCloudinary } from '../lib/cloudinary';
import { z } from 'zod';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  industry: z.string().nullable().catch(null),
  size: z.string().nullable().catch(null),
  description: z.string().nullable().catch(null),
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

export async function getMyCompany(userId: string) {
  const profile = await prisma.clientProfile.findUnique({
    where: { userId },
    include: { company: true },
  });
  return profile?.company ?? null;
}

export async function createOrUpdateCompany(userId: string, body: unknown) {
  const data = companySchema.parse(body);
  const profile = await getOrCreateClientProfile(userId);

  return prisma.company.upsert({
    where: { clientProfileId: profile.id },
    create: { ...data, clientProfileId: profile.id },
    update: data,
  });
}

export async function uploadCompanyLogo(userId: string, logoUrl: string) {
  const profile = await getOrCreateClientProfile(userId);

  const existingCompany = await prisma.company.findUnique({
    where: { clientProfileId: profile.id },
  });

  if (existingCompany?.logoUrl) {
    try {
      const urlParts = existingCompany.logoUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      if (filename) {
        const publicId = `talentnest/company-logos/${filename.split('.')[0]}`;
        await deleteFromCloudinary(publicId);
      }
    } catch (err) {
      console.warn('Failed to delete old logo from Cloudinary');
    }
  }

  return prisma.company.update({
    where: { clientProfileId: profile.id },
    data: { logoUrl },
  });
}
