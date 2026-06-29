import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';

// ─── Types for OAuth token responses ────────────────────────────────────────
interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

interface GitHubUserInfo {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

// ─── Cookie options (same as auth.controller) ────────────────────────────────
const getCookieOptions = (request: FastifyRequest) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isHttps = request.headers['x-forwarded-proto'] === 'https' || request.protocol === 'https';
  
  return {
    path: '/',
    httpOnly: true,
    secure: isProduction || isHttps,
    sameSite: (isProduction || isHttps) ? ('none' as const) : ('lax' as const),
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
};

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── Helper: upsert OAuth user and sign JWT ───────────────────────────────────
async function handleOAuthUser(
  request: FastifyRequest,
  reply: FastifyReply,
  opts: {
    email: string;
    name: string;
    avatar: string;
    provider: string;
    providerId: string;
  }
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
      // Link the OAuth provider to the existing account
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

  const token = await reply.jwtSign({ id: user.id, role: user.role });
  reply.setCookie('token', token, getCookieOptions(request));

  // Redirect to frontend callback page with token in query string
  return reply.redirect(`${FRONTEND_URL}/oauth/callback?token=${token}`);
}

// ─── Google OAuth Callback ────────────────────────────────────────────────────
export const googleCallback = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // @ts-ignore — googleOAuth2 is registered dynamically
    const tokenData = await request.server.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
    const accessToken = tokenData.token.access_token as string;

    // Fetch user profile from Google
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      request.log.error('Failed to fetch Google user info');
      return reply.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }

    const profile = (await res.json()) as GoogleUserInfo;

    if (!profile.email || !profile.verified_email) {
      return reply.redirect(`${FRONTEND_URL}/login?error=email_not_verified`);
    }

    return handleOAuthUser(request, reply, {
      email: profile.email,
      name: profile.name,
      avatar: profile.picture,
      provider: 'google',
      providerId: profile.id,
    });
  } catch (err) {
    request.log.error(err, 'Google OAuth callback failed');
    return reply.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
  }
};

// ─── GitHub OAuth Callback ────────────────────────────────────────────────────
export const githubCallback = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // @ts-ignore — githubOAuth2 is registered dynamically
    const tokenData = await request.server.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
    const accessToken = tokenData.token.access_token as string;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'TalentNest',
    };

    // Fetch profile
    const profileRes = await fetch('https://api.github.com/user', { headers });
    if (!profileRes.ok) {
      request.log.error('Failed to fetch GitHub user info');
      return reply.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }
    const profile = (await profileRes.json()) as GitHubUserInfo;

    // GitHub may not expose email publicly — fetch it separately
    let email = profile.email;
    if (!email) {
      const emailRes = await fetch('https://api.github.com/user/emails', { headers });
      if (emailRes.ok) {
        const emails = (await emailRes.json()) as GitHubEmail[];
        const primary = emails.find((e) => e.primary && e.verified);
        email = primary?.email ?? null;
      }
    }

    if (!email) {
      return reply.redirect(`${FRONTEND_URL}/login?error=no_email`);
    }

    return handleOAuthUser(request, reply, {
      email,
      name: profile.name ?? profile.login,
      avatar: profile.avatar_url,
      provider: 'github',
      providerId: String(profile.id),
    });
  } catch (err) {
    request.log.error(err, 'GitHub OAuth callback failed');
    return reply.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
  }
};
