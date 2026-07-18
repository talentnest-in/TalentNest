import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn(), compare: vi.fn() },
  hash: vi.fn(),
  compare: vi.fn(),
}));

vi.mock('../lib/prisma', () => {
  const mockTx = {
    user: { create: vi.fn().mockResolvedValue({ id: 'u1', email: 'test@test.com', name: 'T', role: 'FREELANCER', avatar: null, provider: null, createdAt: new Date(), onboardingCompleted: false }) },
    freelancerProfile: { create: vi.fn() },
    clientProfile: { create: vi.fn() },
  };
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn().mockResolvedValue({ id: 'u1', email: 'test@test.com', name: 'T', role: 'FREELANCER', avatar: null, provider: null, createdAt: new Date(), onboardingCompleted: false }),
        update: vi.fn(),
      },
      $transaction: vi.fn((fn: any) => fn(mockTx)),
    },
  };
});

vi.mock('../lib/email.service', () => ({
  sendForgotPasswordEmail: vi.fn().mockResolvedValue(true),
  sendWelcomeEmail: vi.fn().mockResolvedValue(true),
}));

import bcrypt from 'bcryptjs';
import { register, login, forgotPassword, resetPassword, getMe } from '../services/auth.service';
import * as emailService from '../lib/email.service';
import { prisma } from '../lib/prisma';

const signJwt = vi.fn().mockResolvedValue('mock-token');

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should throw for duplicate email', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({ id: 'existing' });
      await expect(
        register({ email: 'dup@test.com', password: 'Pass123!', name: 'T', role: 'FREELANCER' }, signJwt)
      ).rejects.toThrow('already exists');
    });

    it('should create user successfully', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (bcrypt.hash as any).mockResolvedValue('hashed');
      const userData = { id: 'u1', email: 'test@test.com', name: 'T', role: 'FREELANCER', avatar: null, provider: null, createdAt: new Date(), onboardingCompleted: false };

      const result = await register(
        { email: 'test@test.com', password: 'Pass123!', name: 'T', role: 'FREELANCER' },
        signJwt
      );
      expect(result.token).toBe('mock-token');
    });
  });

  describe('login', () => {
    it('should throw for wrong email', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      await expect(login({ email: 'x@x.com', password: 'x' }, signJwt))
        .rejects.toThrow('Invalid email or password');
    });

    it('should return user on valid login', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'u1', email: 'test@test.com', name: 'T', password: 'hash',
        role: 'FREELANCER', avatar: null, provider: 'local',
        createdAt: new Date(), onboardingCompleted: true,
      });
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await login({ email: 'test@test.com', password: 'Pass123!' }, signJwt);
      expect(result.token).toBe('mock-token');
    });
  });

  describe('forgotPassword', () => {
    it('should silently skip unknown email', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      await expect(forgotPassword('x@x.com')).resolves.toBeUndefined();
    });

    it('should send email for known user', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', email: 'test@test.com' });
      (prisma.user.update as any).mockResolvedValue({});
      await forgotPassword('test@test.com');
      expect(emailService.sendForgotPasswordEmail).toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    it('should return user profile', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', email: 'test@test.com' });
      const result = await getMe('u1');
      expect(result.email).toBe('test@test.com');
    });

    it('should throw for missing user', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      await expect(getMe('nope')).rejects.toThrow('User not found');
    });
  });
});
