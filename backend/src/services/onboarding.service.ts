import { prisma } from '../lib/prisma';
import { checkAchievements } from '../services/gamification.service';
import { NotFoundError, BadRequestError } from '../lib/errors';

export async function selectRole(
  userId: string,
  role: 'FREELANCER' | 'CLIENT',
  signJwt: (payload: { id: string; role: string | null }) => Promise<string>
) {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });

  if (!existingUser) {
    throw new NotFoundError('User');
  }

  if (existingUser.onboardingCompleted) {
    throw new BadRequestError('Onboarding already completed');
  }

  const user = await prisma.$transaction(async (tx: any) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, name: true, role: true, avatar: true, provider: true, createdAt: true, onboardingCompleted: true },
    });

    if (role === 'FREELANCER') {
      await tx.freelancerProfile.create({ data: { userId: updatedUser.id } });
    } else if (role === 'CLIENT') {
      await tx.clientProfile.create({ data: { userId: updatedUser.id } });
    }

    return updatedUser;
  });

  const token = await signJwt({ id: user.id, role: user.role });

  return { user, token };
}

export async function completeOnboarding(
  userId: string,
  data: {
    title?: string;
    bio?: string;
    location?: string;
    skills?: string[];
    companyName?: string;
    companyIndustry?: string;
  }
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { freelancerProfile: true, clientProfile: true },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  if (user.onboardingCompleted) {
    throw new BadRequestError('Onboarding already completed');
  }

  const updatedUser = await prisma.$transaction(async (tx: any) => {
    if (user.role === 'FREELANCER' && user.freelancerProfile) {
      await tx.freelancerProfile.update({
        where: { userId },
        data: {
          title: data.title,
          bio: data.bio,
          location: data.location,
        },
      });

      if (data.skills && data.skills.length > 0) {
        await tx.skill.createMany({
          data: data.skills.map((s) => ({
            name: s,
            freelancerProfileId: user.freelancerProfile!.id,
          })),
        });
      }
    }

    if (user.role === 'CLIENT' && user.clientProfile) {
      await tx.clientProfile.update({
        where: { userId },
        data: {
          bio: data.bio,
          location: data.location,
        },
      });

      if (data.companyName) {
        await tx.company.create({
          data: {
            clientProfileId: user.clientProfile.id,
            name: data.companyName,
            industry: data.companyIndustry,
          },
        });
      }
    }

    return await tx.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
      select: { id: true, email: true, name: true, role: true, avatar: true, provider: true, createdAt: true, onboardingCompleted: true },
    });
  });

  await checkAchievements(userId, 'PROFILE_COMPLETE');

  return updatedUser;
}
