import { prisma } from '../lib/prisma';
import { deleteFromCloudinary } from '../lib/cloudinary';
import { z } from 'zod';
import { awardExp } from './gamification.service';

const projectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  projectUrl: z.string().nullable().catch(null),
  imageUrl: z.string().nullable().catch(null),
});

export async function getProjects(userId: string, pageStr = '1', limitStr = '10') {
  const skip = (parseInt(pageStr) - 1) * parseInt(limitStr);
  const take = parseInt(limitStr);

  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return { projects: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
  }

  const [projects, total] = await Promise.all([
    prisma.portfolioProject.findMany({
      where: { freelancerProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.portfolioProject.count({
      where: { freelancerProfileId: profile.id },
    }),
  ]);

  return {
    projects,
    pagination: {
      page: parseInt(pageStr),
      limit: parseInt(limitStr),
      total,
      pages: Math.ceil(total / parseInt(limitStr)),
    },
  };
}

export async function addProject(userId: string, body: unknown) {
  const data = projectSchema.parse(body);
  const profile = await prisma.freelancerProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  const project = await prisma.portfolioProject.create({
    data: { ...data, freelancerProfileId: profile.id },
  });

  await awardExp(userId, 'PORTFOLIO_UPLOAD', 'Portfolio item added');

  return project;
}

export async function updateProject(userId: string, id: string, body: unknown) {
  const data = projectSchema.parse(body);
  return prisma.portfolioProject.update({ where: { id }, data });
}

export async function deleteProject(userId: string, id: string) {
  const project = await prisma.portfolioProject.findUnique({ where: { id } });

  if (project?.imageUrl) {
    try {
      const urlParts = project.imageUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      if (filename) {
        const publicId = `talentnest/portfolio/${filename.split('.')[0] || filename}`;
        await deleteFromCloudinary(publicId);
      }
    } catch (err) {
      console.warn('Failed to delete from Cloudinary');
    }
  }

  await prisma.portfolioProject.delete({ where: { id } });
}
