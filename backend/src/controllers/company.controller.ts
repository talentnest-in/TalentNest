import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { uploadFile } from '../lib/upload';
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

export const getMyCompany = async (request: FastifyRequest, reply: FastifyReply) => {
  const profile = await prisma.clientProfile.findUnique({
    where: { userId: request.user.id },
    include: { company: true },
  });
  return reply.send({ company: profile?.company ?? null });
};

export const createOrUpdateCompany = async (request: FastifyRequest, reply: FastifyReply) => {
  const data = companySchema.parse(request.body);
  const profile = await getOrCreateClientProfile(request.user.id);

  const company = await prisma.company.upsert({
    where: { clientProfileId: profile.id },
    create: { ...data, clientProfileId: profile.id },
    update: data,
  });
  return reply.send({ company });
};

export const uploadCompanyLogo = async (request: FastifyRequest, reply: FastifyReply) => {
  const file = await request.file();
  if (!file) return reply.status(400).send({ message: 'No file uploaded' });

  const logoUrl = await uploadFile(file);
  const profile = await getOrCreateClientProfile(request.user.id);

  const company = await prisma.company.update({
    where: { clientProfileId: profile.id },
    data: { logoUrl },
  });
  return reply.send({ logoUrl: company.logoUrl });
};
