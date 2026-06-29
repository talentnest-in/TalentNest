import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { createNotification } from './notification.controller';

// ── Validation Schemas ──
const createOfferSchema = z.object({
  applicationId: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  proposedBudget: z.number().positive('Budget must be positive'),
  currency: z.string().default('USD'),
  estimatedDuration: z.string().nullable().catch(null),
  deadline: z.string().nullable().catch(null).transform((str) => (str ? new Date(str) : null)),
});

const updateOfferStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED', 'CANCELLED']),
});

type CreateOfferInput = z.infer<typeof createOfferSchema>;
type UpdateOfferStatusInput = z.infer<typeof updateOfferStatusSchema>;

// ── Helpers ────────────────────────────────────────────────────────────────────
async function getOfferWithDetails(id: string) {
  return prisma.offer.findUnique({
    where: { id },
    include: {
      application: {
        include: {
          job: {
            include: {
              clientProfile: {
                include: {
                  company: true,
                },
              },
              skills: true,
            },
          },
          profile: {
            include: {
              user: true,
              skills: true,
              experiences: true,
            },
          },
        },
      },
      client: true,
      freelancer: true,
      contract: true,
    },
  });
}

// ── Create Offer (Client) ─────────────────────────────────────────────────────────
export const createOffer = async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = request.user.id;
  const data = createOfferSchema.parse(request.body);

  // Verify application exists and belongs to client's job
  const application = await prisma.jobApplication.findUnique({
    where: { id: data.applicationId },
    include: {
      job: true,
      profile: true,
    },
  });

  if (!application) {
    return reply.status(404).send({ message: 'Application not found' });
  }

  // Verify the job belongs to the client
  const clientProfile = await prisma.clientProfile.findUnique({
    where: { userId },
  });

  if (!clientProfile || application.job.clientProfileId !== clientProfile.id) {
    return reply.status(403).send({ message: 'You can only send offers for your own jobs' });
  }

  // Verify application is SHORTLISTED
  if (application.status !== 'SHORTLISTED') {
    return reply.status(400).send({ message: 'Can only send offers for shortlisted applications' });
  }

  // Check if offer already exists for this application
  const existingOffer = await prisma.offer.findUnique({
    where: { applicationId: data.applicationId },
  });

  if (existingOffer) {
    return reply.status(409).send({ message: 'An offer already exists for this application' });
  }

  // Set expiration date (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Create offer
  const offer = await prisma.offer.create({
    data: {
      ...data,
      clientId: userId,
      freelancerId: application.profile.userId,
      expiresAt,
    },
    include: {
      application: {
        include: {
          job: true,
          profile: {
            include: {
              user: true,
            },
          },
        },
      },
      client: true,
      freelancer: true,
    },
  });

  // Notify freelancer of new offer
  await createNotification({
    userId: offer.freelancerId,
    type: 'NEW_OFFER',
    title: 'New Offer Received',
    message: `You have received a new offer for ${offer.application.job.title} from ${offer.client.name}`,
    link: `/freelancer/offers/${offer.id}`,
  });

  return reply.status(201).send({ offer });
};

// ── Get Client Offers ─────────────────────────────────────────────────────────────
export const getClientOffers = async (
  request: FastifyRequest<{ Querystring: { status?: string; search?: string; page?: string; limit?: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user.id;
  const { status, search, page = '1', limit = '10' } = request.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where: any = { clientId: userId };
  if (status) {
    where.status = status;
  }
  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
  }

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      include: {
        application: {
          include: {
            job: true,
            profile: {
              include: {
                user: true,
              },
            },
          },
        },
        client: true,
        freelancer: true,
        contract: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.offer.count({ where }),
  ]);

  return reply.send({
    offers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
};

// ── Get Offer Details ─────────────────────────────────────────────────────────────
export const getOfferDetails = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user.id;
  const { id } = request.params;

  const offer = await getOfferWithDetails(id);

  if (!offer) {
    return reply.status(404).send({ message: 'Offer not found' });
  }

  // Verify user is either the client or freelancer
  if (offer.clientId !== userId && offer.freelancerId !== userId) {
    return reply.status(403).send({ message: 'Access denied' });
  }

  return reply.send({ offer });
};

// ── Cancel Offer (Client) ─────────────────────────────────────────────────────────
export const cancelOffer = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user.id;
  const { id } = request.params;

  const offer = await prisma.offer.findUnique({
    where: { id },
  });

  if (!offer) {
    return reply.status(404).send({ message: 'Offer not found' });
  }

  // Verify user is the client
  if (offer.clientId !== userId) {
    return reply.status(403).send({ message: 'Only the client can cancel this offer' });
  }

  // Verify offer is still pending
  if (offer.status !== 'PENDING') {
    return reply.status(400).send({ message: 'Can only cancel pending offers' });
  }

  const updatedOffer = await prisma.offer.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: {
      application: {
        include: {
          job: true,
          profile: {
            include: {
              user: true,
            },
          },
        },
      },
      client: true,
      freelancer: true,
    },
  });

  return reply.send({ offer: updatedOffer });
};

// ── Get Freelancer Offers ───────────────────────────────────────────────────────────
export const getFreelancerOffers = async (
  request: FastifyRequest<{ Querystring: { status?: string; page?: string; limit?: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user.id;
  const { status, page = '1', limit = '10' } = request.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where: any = { freelancerId: userId };
  if (status) {
    where.status = status;
  }

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      include: {
        application: {
          include: {
            job: {
              include: {
                clientProfile: {
                  include: {
                    company: true,
                  },
                },
              },
            },
          },
        },
        client: true,
        freelancer: true,
        contract: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.offer.count({ where }),
  ]);

  return reply.send({
    offers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
};

// ── Accept Offer (Freelancer) ───────────────────────────────────────────────────────
export const acceptOffer = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user.id;
  const { id } = request.params;

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: {
      application: {
        include: {
          job: true,
        },
      },
      client: true,
    },
  });

  if (!offer) {
    return reply.status(404).send({ message: 'Offer not found' });
  }

  // Verify user is the freelancer
  if (offer.freelancerId !== userId) {
    return reply.status(403).send({ message: 'Only the freelancer can accept this offer' });
  }

  // Verify offer is still pending and not expired
  if (offer.status !== 'PENDING') {
    // If already accepted, return the existing contract (idempotent)
    if (offer.status === 'ACCEPTED') {
      const existingContract = await prisma.contract.findUnique({
        where: { offerId: offer.id },
        include: { offer: true, job: true, client: true, freelancer: true },
      });
      const existingConversation = existingContract
        ? await prisma.conversation.findUnique({ where: { contractId: existingContract.id } })
        : null;
      return reply.send({ offer, contract: existingContract, conversation: existingConversation });
    }
    return reply.status(400).send({ message: 'Offer is no longer available' });
  }

  if (new Date() > offer.expiresAt) {
    return reply.status(400).send({ message: 'Offer has expired' });
  }

  // Execute transaction: Update offer, update application, create contract
  const result = await prisma.$transaction(async (tx) => {
    // Update offer status
    const updatedOffer = await tx.offer.update({
      where: { id },
      data: { status: 'ACCEPTED' },
    });

    // Update application status to HIRED
    await tx.jobApplication.update({
      where: { id: offer.applicationId },
      data: { status: 'HIRED' },
    });

    // Create contract
    const contract = await tx.contract.create({
      data: {
        offerId: offer.id,
        jobId: offer.application.jobId,
        clientId: offer.clientId,
        freelancerId: offer.freelancerId,
        title: offer.title,
        description: offer.message,
        agreedBudget: offer.proposedBudget,
        currency: offer.currency,
        deadline: offer.deadline,
        status: 'ACTIVE',
        startedAt: new Date(),
      },
      include: {
        offer: true,
        job: true,
        client: true,
        freelancer: true,
      },
    });

    // Create conversation for the contract
    const conversation = await tx.conversation.create({
      data: {
        contractId: contract.id,
        clientId: contract.clientId,
        freelancerId: contract.freelancerId,
      },
    });

    return { offer: updatedOffer, contract, conversation };
  });

  // Notify client of accepted offer and contract creation
  await createNotification({
    userId: offer.clientId,
    type: 'OFFER_ACCEPTED',
    title: 'Offer Accepted',
    message: `Your offer for ${offer.application.job.title} was accepted. A new contract has been created.`,
    link: `/client/contracts/${result.contract.id}`,
  });

  return reply.send(result);
};

// ── Decline Offer (Freelancer) ───────────────────────────────────────────────────────
export const declineOffer = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const userId = request.user.id;
  const { id } = request.params;

  const offer = await prisma.offer.findUnique({
    where: { id },
  });

  if (!offer) {
    return reply.status(404).send({ message: 'Offer not found' });
  }

  // Verify user is the freelancer
  if (offer.freelancerId !== userId) {
    return reply.status(403).send({ message: 'Only the freelancer can decline this offer' });
  }

  // Verify offer is still pending
  if (offer.status !== 'PENDING') {
    return reply.status(400).send({ message: 'Offer is no longer available' });
  }

  const updatedOffer = await prisma.offer.update({
    where: { id },
    data: { status: 'DECLINED' },
    include: {
      application: {
        include: {
          job: true,
          profile: {
            include: {
              user: true,
            },
          },
        },
      },
      client: true,
      freelancer: true,
    },
  });

  return reply.send({ offer: updatedOffer });
};
