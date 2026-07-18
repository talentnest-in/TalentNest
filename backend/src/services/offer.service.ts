import { prisma } from '../lib/prisma';
import { NotFoundError, ForbiddenError, BadRequestError, ConflictError } from '../lib/errors';
import { createNotification } from './notification.service';

// ── Helpers ──
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

export async function createOffer(
  userId: string,
  data: {
    applicationId: string;
    title: string;
    message: string;
    proposedBudget: number;
    currency?: string;
    estimatedDuration?: string | null;
    deadline?: Date | null;
  }
) {
  const application = await prisma.jobApplication.findUnique({
    where: { id: data.applicationId },
    include: { job: true, profile: true },
  });

  if (!application) {
    throw new NotFoundError('Application');
  }

  const clientProfile = await prisma.clientProfile.findUnique({
    where: { userId },
  });

  if (!clientProfile || application.job.clientProfileId !== clientProfile.id) {
    throw new ForbiddenError('You can only send offers for your own jobs');
  }

  if (application.status !== 'SHORTLISTED') {
    throw new BadRequestError('Can only send offers for shortlisted applications');
  }

  const existingOffer = await prisma.offer.findUnique({
    where: { applicationId: data.applicationId },
  });

  if (existingOffer) {
    throw new ConflictError('An offer already exists for this application');
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

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
            include: { user: true },
          },
        },
      },
      client: true,
      freelancer: true,
    },
  });

  await createNotification({
    userId: offer.freelancerId,
    type: 'NEW_OFFER',
    title: 'New Offer Received',
    message: `You have received a new offer for ${offer.application.job.title} from ${offer.client.name}`,
    link: `/freelancer/offers/${offer.id}`,
  });

  return { offer };
}

export async function getClientOffers(
  userId: string,
  query: { status?: string; search?: string; page?: string; limit?: string }
) {
  const { status, search, page = '1', limit = '10' } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where: any = { clientId: userId };
  if (status) {
    where.status = status;
  }
  if (search) {
    where.title = { contains: search, mode: 'insensitive' as const };
  }

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      include: {
        application: {
          include: {
            job: true,
            profile: {
              include: { user: true },
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

  return {
    offers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
}

export async function getFreelancerOffers(
  userId: string,
  query: { status?: string; page?: string; limit?: string }
) {
  const { status, page = '1', limit = '10' } = query;
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
                  include: { company: true },
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

  return {
    offers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
}

export async function getOfferDetails(userId: string, offerId: string) {
  const offer = await getOfferWithDetails(offerId);

  if (!offer) {
    throw new NotFoundError('Offer');
  }

  if (offer.clientId !== userId && offer.freelancerId !== userId) {
    throw new ForbiddenError('Access denied');
  }

  return { offer };
}

export async function cancelOffer(userId: string, offerId: string) {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
  });

  if (!offer) {
    throw new NotFoundError('Offer');
  }

  if (offer.clientId !== userId) {
    throw new ForbiddenError('Only the client can cancel this offer');
  }

  if (offer.status !== 'PENDING') {
    throw new BadRequestError('Can only cancel pending offers');
  }

  const updatedOffer = await prisma.offer.update({
    where: { id: offerId },
    data: { status: 'CANCELLED' },
    include: {
      application: {
        include: {
          job: true,
          profile: {
            include: { user: true },
          },
        },
      },
      client: true,
      freelancer: true,
    },
  });

  return { offer: updatedOffer };
}

export async function acceptOffer(userId: string, offerId: string) {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      application: {
        include: { job: true },
      },
      client: true,
    },
  });

  if (!offer) {
    throw new NotFoundError('Offer');
  }

  if (offer.freelancerId !== userId) {
    throw new ForbiddenError('Only the freelancer can accept this offer');
  }

  if (offer.status !== 'PENDING') {
    if (offer.status === 'ACCEPTED') {
      const existingContract = await prisma.contract.findUnique({
        where: { offerId: offer.id },
        include: { offer: true, job: true, client: true, freelancer: true },
      });
      const existingConversation = existingContract
        ? await prisma.conversation.findUnique({ where: { contractId: existingContract.id } })
        : null;
      return { offer, contract: existingContract, conversation: existingConversation };
    }
    throw new BadRequestError('Offer is no longer available');
  }

  if (new Date() > offer.expiresAt) {
    throw new BadRequestError('Offer has expired');
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedOffer = await tx.offer.update({
      where: { id: offerId },
      data: { status: 'ACCEPTED' },
    });

    await tx.jobApplication.update({
      where: { id: offer.applicationId },
      data: { status: 'HIRED' },
    });

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

    const conversation = await tx.conversation.create({
      data: {
        contractId: contract.id,
        clientId: contract.clientId,
        freelancerId: contract.freelancerId,
      },
    });

    return { offer: updatedOffer, contract, conversation };
  });

  await createNotification({
    userId: offer.clientId,
    type: 'OFFER_ACCEPTED',
    title: 'Offer Accepted',
    message: `Your offer for ${offer.application.job.title} was accepted. A new contract has been created.`,
    link: `/client/contracts/${result.contract.id}`,
  });

  return result;
}

export async function declineOffer(userId: string, offerId: string) {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
  });

  if (!offer) {
    throw new NotFoundError('Offer');
  }

  if (offer.freelancerId !== userId) {
    throw new ForbiddenError('Only the freelancer can decline this offer');
  }

  if (offer.status !== 'PENDING') {
    throw new BadRequestError('Offer is no longer available');
  }

  const updatedOffer = await prisma.offer.update({
    where: { id: offerId },
    data: { status: 'DECLINED' },
    include: {
      application: {
        include: {
          job: true,
          profile: {
            include: { user: true },
          },
        },
      },
      client: true,
      freelancer: true,
    },
  });

  return { offer: updatedOffer };
}
