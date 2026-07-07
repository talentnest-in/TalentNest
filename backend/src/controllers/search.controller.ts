import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';

export const globalSearch = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { q } = request.query as { q?: string };
    if (!q) {
      return reply.send({ statusCode: 200, data: { communities: [], posts: [], users: [], jobs: [] } });
    }

    const [communities, posts, users, jobs] = await Promise.all([
      prisma.community.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
          type: 'PUBLIC',
        },
        take: 5,
        include: { _count: { select: { members: true } } },
      }),
      prisma.post.findMany({
        where: {
          content: { contains: q, mode: 'insensitive' },
          isHidden: false,
          community: { type: 'PUBLIC' }, // Only public community posts
        },
        take: 5,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          community: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.user.findMany({
        where: { name: { contains: q, mode: 'insensitive' } },
        take: 5,
        select: { id: true, name: true, avatar: true },
      }),
      prisma.job.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
          status: 'OPEN',
        },
        take: 5,
        include: {
          skills: true,
          clientProfile: {
            include: { company: true }
          }
        }
      })
    ]);

    return reply.send({
      statusCode: 200,
      data: { communities, posts, users, jobs },
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};
