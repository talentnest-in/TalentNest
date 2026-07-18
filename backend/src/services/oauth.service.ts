import { prisma } from '../lib/prisma';
import { getCookieOptions } from './auth.service';

export async function handleOAuthUser(
  opts: {
    email: string;
    name: string;
    avatar: string;
    provider: string;
    providerId: string;
  },
  signJwt: (payload: { id: string; role: string | null }) => Promise<string>
) {
  const { email, name, avatar, provider, providerId } = opts;

  // 1. Try to find by provider + providerId (returning user via same OAuth)
  let user = await prisma.user.findUnique({
    where: { provider_providerId: { provider, providerId } },
  });

  // 2. If not found, try to link to existing local account by email
  if (!user) {
    user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { provider, providerId, avatar: user.avatar ?? avatar },
      });
    }
  }

  // 3. No existing account at all — create a new one
  if (!user) {
    user = await prisma.user.create({
      data: { email, name, avatar, provider, providerId },
    });
  }

  const token = await signJwt({ id: user.id, role: user.role });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      provider: user.provider,
      createdAt: user.createdAt,
      onboardingCompleted: user.onboardingCompleted,
    },
    token,
  };
}

export { getCookieOptions };
