import { prisma } from '../lib/prisma';
import { uploadFile } from '../lib/upload';
import { deleteFromCloudinary } from '../lib/cloudinary';
import { z } from 'zod';
import { NotFoundError, BadRequestError } from '../lib/errors';
import { checkAndAwardProfileCompletion } from './gamification.service';

const profileSchema = z.object({
  title: z.string().nullable().catch(null),
  bio: z.string().nullable().catch(null),
  hourlyRate: z.number().nullable().catch(null),
  location: z.string().nullable().catch(null),
});

const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
});

const experienceSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  role: z.string().min(1, 'Role is required'),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().nullable().catch(null).transform((str) => (str ? new Date(str) : null)),
  current: z.boolean().default(false),
  description: z.string().nullable().catch(null),
});

const educationSchema = z.object({
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().min(1, 'Degree is required'),
  fieldOfStudy: z.string().min(1, 'Field of study is required'),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().nullable().catch(null).transform((str) => (str ? new Date(str) : null)),
});

export async function getProfile(userId: string) {
  return prisma.freelancerProfile.findUnique({
    where: { userId },
    include: {
      skills: true,
      experiences: { orderBy: { startDate: 'desc' } },
      educations: { orderBy: { startDate: 'desc' } },
      projects: { orderBy: { createdAt: 'desc' } },
    },
  });
}

export async function upsertProfile(userId: string, body: unknown) {
  const data = profileSchema.parse(body);
  const profile = await prisma.freelancerProfile.upsert({
    where: { userId },
    update: data,
    create: { ...data, userId },
  });
  await checkAndAwardProfileCompletion(userId);
  return profile;
}

export async function uploadResume(userId: string, resumeUrl: string) {
  const existingProfile = await prisma.freelancerProfile.findUnique({
    where: { userId },
  });

  if (existingProfile?.resumeUrl) {
    try {
      const urlParts = existingProfile.resumeUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      if (filename) {
        const publicId = `talentnest/resumes/${filename.split('.')[0]}`;
        await deleteFromCloudinary(publicId);
      }
    } catch (err) {
      console.warn('Failed to delete old resume from Cloudinary');
    }
  }

  const profile = await prisma.freelancerProfile.upsert({
    where: { userId },
    update: { resumeUrl },
    create: { userId, resumeUrl },
  });

  await checkAndAwardProfileCompletion(userId);
  return profile;
}

export async function uploadAvatar(userId: string, avatarUrl: string) {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (existingUser?.avatar) {
    try {
      const urlParts = existingUser.avatar.split('/');
      const filename = urlParts[urlParts.length - 1];
      if (filename) {
        const publicId = `talentnest/avatars/${filename.split('.')[0]}`;
        await deleteFromCloudinary(publicId);
      }
    } catch (err) {
      console.warn('Failed to delete old avatar from Cloudinary');
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data: { avatar: avatarUrl },
  });
}

export async function addSkill(userId: string, body: unknown) {
  const { name } = skillSchema.parse(body);
  const profile = await prisma.freelancerProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  const skill = await prisma.skill.create({
    data: { name, freelancerProfileId: profile.id },
  });
  await checkAndAwardProfileCompletion(userId);
  return skill;
}

export async function deleteSkill(userId: string, id: string) {
  await prisma.skill.delete({ where: { id } });
  await checkAndAwardProfileCompletion(userId);
}

export async function addExperience(userId: string, body: unknown) {
  const data = experienceSchema.parse(body);
  const profile = await prisma.freelancerProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  const experience = await prisma.experience.create({
    data: { ...data, freelancerProfileId: profile.id },
  });
  await checkAndAwardProfileCompletion(userId);
  return experience;
}

export async function updateExperience(userId: string, id: string, body: unknown) {
  const data = experienceSchema.parse(body);
  const experience = await prisma.experience.update({ where: { id }, data });
  await checkAndAwardProfileCompletion(userId);
  return experience;
}

export async function deleteExperience(userId: string, id: string) {
  await prisma.experience.delete({ where: { id } });
  await checkAndAwardProfileCompletion(userId);
}

export async function addEducation(userId: string, body: unknown) {
  const data = educationSchema.parse(body);
  const profile = await prisma.freelancerProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  const education = await prisma.education.create({
    data: { ...data, freelancerProfileId: profile.id },
  });
  await checkAndAwardProfileCompletion(userId);
  return education;
}

export async function updateEducation(userId: string, id: string, body: unknown) {
  const data = educationSchema.parse(body);
  const education = await prisma.education.update({ where: { id }, data });
  await checkAndAwardProfileCompletion(userId);
  return education;
}

export async function deleteEducation(userId: string, id: string) {
  await prisma.education.delete({ where: { id } });
  await checkAndAwardProfileCompletion(userId);
}
