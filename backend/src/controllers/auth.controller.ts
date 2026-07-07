import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';
import { sendForgotPasswordEmail } from '../lib/email.service';

// ── Validation Schemas ───────────────────────────────────────────────────────
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['FREELANCER', 'CLIENT']),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// ── Cookie options ───────────────────────────────────────────────────────────
const getCookieOptions = (request: FastifyRequest) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isHttps = request.headers['x-forwarded-proto'] === 'https' || request.protocol === 'https';
  
  return {
    path: '/',
    httpOnly: true,
    secure: isProduction || isHttps, // Use secure cookies in production or when using HTTPS
    sameSite: (isProduction || isHttps) ? ('none' as const) : ('lax' as const),
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  };
};

// ── Register ─────────────────────────────────────────────────────────────────
export const register = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email, password, name, role } = registerSchema.parse(request.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return reply.status(409).send({ statusCode: 409, message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx:any) => {
      const newUser = await tx.user.create({
        data: { email, name, password: hashedPassword, role, onboardingCompleted: true },
        select: { id: true, email: true, name: true, role: true, avatar: true, provider: true, createdAt: true, onboardingCompleted: true },
      });

      if (role === 'FREELANCER') {
        await tx.freelancerProfile.create({ data: { userId: newUser.id } });
      } else if (role === 'CLIENT') {
        await tx.clientProfile.create({ data: { userId: newUser.id } });
      }

      return newUser;
    });

    const token = await reply.jwtSign({ id: user.id, role: user.role });

    reply.setCookie('token', token, getCookieOptions(request));

    return reply.status(201).send({ user, token });
  } catch (error) {
    if (error instanceof z.ZodError) throw error; // Let global handler format Zod errors
    request.log.error(error, 'register failed');
    throw error;
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
export const login = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email, password } = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.status(401).send({ statusCode: 401, message: 'Invalid email or password' });
    }

    if (!user.password) {
      return reply.status(401).send({ statusCode: 401, message: 'Please log in using your Google or GitHub account.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return reply.status(401).send({ statusCode: 401, message: 'Invalid email or password' });
    }

    const token = await reply.jwtSign({ id: user.id, role: user.role });

    reply.setCookie('token', token, getCookieOptions(request));

    return reply.send({
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role,
        avatar: user.avatar,
        provider: user.provider,
        onboardingCompleted: user.onboardingCompleted
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    request.log.error(error, 'login failed');
    throw error;
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────
export const logout = async (request: FastifyRequest, reply: FastifyReply) => {
  reply.clearCookie('token', getCookieOptions(request));
  return reply.send({ statusCode: 200, message: 'Logged out successfully' });
};

// ── Refresh Token ────────────────────────────────────────────────────────────
export const refresh = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Check for existing token
    let token = (request.cookies as any).token;
    if (!token && request.headers.authorization?.startsWith('Bearer ')) {
      token = request.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'No token provided' });
    }

    // Verify token (ignoring expiration if we want to allow refreshing an expired token, but fastify-jwt verify throws on expired by default. Let's just decode and re-issue if valid or recently expired. For now we will just verify and re-issue).
    // Actually, we can use request.server.jwt.decode to get the payload, verify the user exists, and issue a new token.
    const decoded: any = (request.server as any).jwt.decode(token);
    
    if (!decoded || !decoded.id) {
       return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid token' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not found' });
    }

    const newToken = await reply.jwtSign({ id: user.id, role: user.role });
    reply.setCookie('token', newToken, getCookieOptions(request));

    return reply.send({ statusCode: 200, token: newToken, message: 'Token refreshed' });
  } catch (error) {
    request.log.error(error, 'refresh failed');
    return reply.status(500).send({ statusCode: 500, error: 'Internal Server Error' });
  }
};

// ── Get Me ────────────────────────────────────────────────────────────────────
export const getMe = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (request.user as any).id },
      select: { id: true, email: true, name: true, role: true, avatar: true, provider: true, createdAt: true, onboardingCompleted: true },
    });

    if (!user) {
      return reply.status(404).send({ statusCode: 404, message: 'User not found' });
    }

    return reply.send({ user });
  } catch (error) {
    request.log.error(error, 'getMe failed');
    throw error;
  }
};

// ── Forgot Password ───────────────────────────────────────────────────────────
export const forgotPassword = async (
  request: FastifyRequest<{ Body: { email: string } }>,
  reply: FastifyReply
) => {
  try {
    const { email } = forgotPasswordSchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return reply.send({ message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    // Store a SHA-256 hash of the token (fast, queryable — do NOT use bcrypt here)
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { email },
      data: { resetPasswordToken: hashedToken, resetPasswordExpires: resetExpires },
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    // Send password reset email
    try {
      await sendForgotPasswordEmail(email, resetUrl);
    } catch (emailError) {
      request.log.error(emailError, 'Failed to send password reset email');
      // Don't fail the request - still return success to prevent email enumeration
      // But log the error for debugging
    }

    return reply.send({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    request.log.error(error, 'forgotPassword failed');
    throw error;
  }
};

// ── Reset Password ────────────────────────────────────────────────────────────
export const resetPassword = async (
  request: FastifyRequest<{ Body: { token: string; password: string } }>,
  reply: FastifyReply
) => {
  try {
    const { token, password } = resetPasswordSchema.parse(request.body);

    // Hash the incoming token to look it up in the database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { gt: new Date() }, // Must not be expired
      },
    });

    if (!user) {
      return reply.status(400).send({ statusCode: 400, message: 'Invalid or expired password reset token' });
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

    return reply.send({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    request.log.error(error, 'resetPassword failed');
    throw error;
  }
};
