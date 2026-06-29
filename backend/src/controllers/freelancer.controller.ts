import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { uploadFile } from '../lib/upload';
import { deleteFromCloudinary } from '../lib/cloudinary';
import { z } from 'zod';

// ── Validation Schemas ──
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

// ── Profile ──
export const getProfile = async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = request.user.id;
  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId },
    include: {
      skills: true,
      experiences: { orderBy: { startDate: 'desc' } },
      educations: { orderBy: { startDate: 'desc' } },
      projects: { orderBy: { createdAt: 'desc' } },
    },
  });
  return reply.send({ profile });
};

export const upsertProfile = async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = request.user.id;
  const data = profileSchema.parse(request.body);

  const profile = await prisma.freelancerProfile.upsert({
    where: { userId },
    update: data,
    create: { ...data, userId },
  });

  return reply.send({ profile });
};

// ── Uploads ──
export const uploadResume = async (request: FastifyRequest, reply: FastifyReply) => {
  const file = await request.file();
  if (!file) return reply.status(400).send({ message: 'No file uploaded' });

  const uploadResult = await uploadFile(file, 'resume');

  // Delete old resume from Cloudinary if exists
  const existingProfile = await prisma.freelancerProfile.findUnique({
    where: { userId: request.user.id },
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
      request.log.warn('Failed to delete old resume from Cloudinary');
    }
  }

  const profile = await prisma.freelancerProfile.upsert({
    where: { userId: request.user.id },
    update: { resumeUrl: uploadResult.secure_url },
    create: { userId: request.user.id, resumeUrl: uploadResult.secure_url },
  });

  return reply.send({ resumeUrl: profile.resumeUrl });
};

export const uploadAvatar = async (request: FastifyRequest, reply: FastifyReply) => {
  const file = await request.file();
  if (!file) return reply.status(400).send({ message: 'No file uploaded' });

  const uploadResult = await uploadFile(file, 'avatar');

  // Delete old avatar from Cloudinary if exists
  const existingUser = await prisma.user.findUnique({
    where: { id: request.user.id },
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
      request.log.warn('Failed to delete old avatar from Cloudinary');
    }
  }

  await prisma.user.update({
    where: { id: request.user.id },
    data: { avatar: uploadResult.secure_url },
  });

  return reply.send({ avatar: uploadResult.secure_url });
};

// ── Skills ──
export const addSkill = async (request: FastifyRequest, reply: FastifyReply) => {
  const { name } = skillSchema.parse(request.body);
  // Auto-create profile if not exists
  const profile = await prisma.freelancerProfile.upsert({
    where: { userId: request.user.id },
    create: { userId: request.user.id },
    update: {},
  });

  const skill = await prisma.skill.create({
    data: { name, freelancerProfileId: profile.id },
  });
  return reply.send({ skill });
};

export const deleteSkill = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const { id } = request.params;
  await prisma.skill.delete({ where: { id } });
  return reply.send({ success: true });
};

// ── Experience ──
export const addExperience = async (request: FastifyRequest, reply: FastifyReply) => {
  const data = experienceSchema.parse(request.body);
  const profile = await prisma.freelancerProfile.upsert({
    where: { userId: request.user.id },
    create: { userId: request.user.id },
    update: {},
  });

  const experience = await prisma.experience.create({
    data: { ...data, freelancerProfileId: profile.id },
  });
  return reply.send({ experience });
};

export const updateExperience = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const { id } = request.params;
  const data = experienceSchema.parse(request.body);
  const experience = await prisma.experience.update({ where: { id }, data });
  return reply.send({ experience });
};

export const deleteExperience = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const { id } = request.params;
  await prisma.experience.delete({ where: { id } });
  return reply.send({ success: true });
};

// ── Education ──
export const addEducation = async (request: FastifyRequest, reply: FastifyReply) => {
  const data = educationSchema.parse(request.body);
  const profile = await prisma.freelancerProfile.upsert({
    where: { userId: request.user.id },
    create: { userId: request.user.id },
    update: {},
  });

  const education = await prisma.education.create({
    data: { ...data, freelancerProfileId: profile.id },
  });
  return reply.send({ education });
};

export const updateEducation = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const { id } = request.params;
  const data = educationSchema.parse(request.body);
  const education = await prisma.education.update({ where: { id }, data });
  return reply.send({ education });
};

export const deleteEducation = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const { id } = request.params;
  await prisma.education.delete({ where: { id } });
  return reply.send({ success: true });
};
