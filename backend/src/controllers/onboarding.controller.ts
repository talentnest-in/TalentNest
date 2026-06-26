import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const selectRoleSchema = z.object({
  role: z.enum(['FREELANCER', 'CLIENT']),
});

export const selectRole = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { role } = selectRoleSchema.parse(request.body);
    const userId = request.user.id;

    // 1. Fetch user to ensure they haven't already completed onboarding
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });

    if (!existingUser) {
      return reply.status(404).send({ statusCode: 404, message: 'User not found' });
    }

    if (existingUser.onboardingCompleted) {
      return reply.status(400).send({ statusCode: 400, message: 'Onboarding already completed' });
    }

    // 2. Update user role and create associated profile in a transaction
    const user = await prisma.$transaction(async (tx:any) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { role, onboardingCompleted: true },
        select: { id: true, email: true, name: true, role: true, avatar: true, provider: true, createdAt: true, onboardingCompleted: true },
      });

      if (role === 'FREELANCER') {
        await tx.freelancerProfile.create({ data: { userId: updatedUser.id } });
      } else if (role === 'CLIENT') {
        await tx.clientProfile.create({ data: { userId: updatedUser.id } });
      }

      return updatedUser;
    });

    // 3. Issue a new JWT token with the updated role
    const token = await reply.jwtSign({ id: user.id, role: user.role });

    // 4. Update the cookie
    const COOKIE_OPTIONS = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? ('strict' as const) : ('lax' as const),
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    };

    reply.setCookie('token', token, COOKIE_OPTIONS);

    return reply.status(200).send({ user, token });
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, message: 'Internal Server Error' });
  }
};
