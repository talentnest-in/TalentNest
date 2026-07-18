import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { sendForgotPasswordEmail, sendWelcomeEmail } from '../lib/email.service';
import { updateDailyStreak } from '../services/gamification.service';
import { ConflictError, UnauthorizedError, NotFoundError, BadRequestError } from '../lib/errors';
import { queueManager, QUEUES } from '../lib/queue';

export interface AuthResult {
  user: { id: string; email: string; name: string | null; role: string | null; avatar: string | null; provider: string | null; createdAt: Date; onboardingCompleted: boolean };
  token: string;
}

export function getCookieOptions(isHttps?: boolean) {
  const isProduction = process.env.NODE_ENV === 'production';
  const secure = isProduction || isHttps;
  return {
    path: '/',
    httpOnly: true,
    secure,
    sameSite: (secure) ? ('none' as const) : ('lax' as const),
    maxAge: 60 * 60 * 24 * 7,
  };
}

export async function register(
  data: { email: string; password: string; name: string; role: 'FREELANCER' | 'CLIENT' },
  signJwt: (payload: { id: string; role: string | null }) => Promise<string>
): Promise<AuthResult> {
  const { email, password, name, role } = data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ConflictError('An account with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.$transaction(async (tx: any) => {
    const newUser = await tx.user.create({
      data: { email, name, password: hashedPassword, role, onboardingCompleted: false },
      select: { id: true, email: true, name: true, role: true, avatar: true, provider: true, createdAt: true, onboardingCompleted: true },
    });

    if (role === 'FREELANCER') {
      await tx.freelancerProfile.create({ data: { userId: newUser.id } });
    } else if (role === 'CLIENT') {
      await tx.clientProfile.create({ data: { userId: newUser.id } });
    }

    return newUser;
  });

  const token = await signJwt({ id: user.id, role: user.role });

  // Queue welcome email (non-blocking)
  sendWelcomeEmail(user.email, user.name || 'User').catch(() => {});

  return { user, token };
}

export async function login(
  data: { email: string; password: string },
  signJwt: (payload: { id: string; role: string | null }) => Promise<string>
): Promise<AuthResult> {
  const { email, password } = data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.password) {
    throw new UnauthorizedError('Please log in using your Google or GitHub account.');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = await signJwt({ id: user.id, role: user.role });

  await updateDailyStreak(user.id);

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

export async function refresh(
  userId: string,
  signJwt: (payload: { id: string; role: string | null }) => Promise<string>
): Promise<{ token: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  const token = await signJwt({ id: user.id, role: user.role });

  return { token };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, avatar: true, provider: true, createdAt: true, onboardingCompleted: true },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  return user;
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { email },
    data: { resetPasswordToken: hashedToken, resetPasswordExpires: resetExpires },
  });

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

  try {
    await sendForgotPasswordEmail(email, resetUrl);
  } catch (emailError) {
    console.error('Failed to send password reset email:', emailError);
  }
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new BadRequestError('Invalid or expired password reset token');
  }

  const newHashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: newHashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });
}
