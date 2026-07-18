import { FastifyRequest, FastifyReply } from 'fastify';
import { handleOAuthUser } from '../services/oauth.service';
import { getCookieOptions } from '../services/auth.service';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function isHttps(request: FastifyRequest): boolean {
  return request.headers['x-forwarded-proto'] === 'https' || request.protocol === 'https';
}

function getOAuthToken(request: FastifyRequest) {
  return (request.server as any).googleOAuth2?.getAccessTokenFromAuthorizationCodeFlow(request) as Promise<{ token: { access_token: string } }>;
}

function getGitHubOAuthToken(request: FastifyRequest) {
  return (request.server as any).githubOAuth2?.getAccessTokenFromAuthorizationCodeFlow(request) as Promise<{ token: { access_token: string } }>;
}

export const googleCallback = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { token } = await getOAuthToken(request);

    const userInfo: any = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    }).then((res) => res.json());

    const signJwt = (payload: { id: string; role: string | null }) => reply.jwtSign(payload);
    const result = await handleOAuthUser({ provider: 'google', providerId: userInfo.id, email: userInfo.email, name: userInfo.name, avatar: userInfo.picture }, signJwt);

    reply.setCookie('token', result.token, { ...getCookieOptions(isHttps(request)), secure: (getCookieOptions(isHttps(request)).secure || false) });
    return reply.redirect(`${FRONTEND_URL.replace(/\/$/, '')}/oauth/callback?token=${result.token}`);
  } catch (error) {
    request.log.error(error, 'Google OAuth callback failed');
    return reply.redirect(`${FRONTEND_URL.replace(/\/$/, '')}/oauth/callback?error=oauth_failed`);
  }
};

export const githubCallback = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { token } = await getGitHubOAuthToken(request);

    const userInfo: any = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    }).then((res) => res.json());

    const emails: any = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    }).then((res) => res.json());

    const primaryEmail = Array.isArray(emails) ? emails.find((e: any) => e.primary)?.email || emails[0]?.email : userInfo.email;

    const signJwt = (payload: { id: string; role: string | null }) => reply.jwtSign(payload);
    const result = await handleOAuthUser({ provider: 'github', providerId: String(userInfo.id), email: primaryEmail, name: userInfo.name || userInfo.login, avatar: userInfo.avatar_url }, signJwt);

    reply.setCookie('token', result.token, { ...getCookieOptions(isHttps(request)), secure: (getCookieOptions(isHttps(request)).secure || false) });
    return reply.redirect(`${FRONTEND_URL.replace(/\/$/, '')}/oauth/callback?token=${result.token}`);
  } catch (error) {
    request.log.error(error, 'GitHub OAuth callback failed');
    return reply.redirect(`${FRONTEND_URL.replace(/\/$/, '')}/oauth/callback?error=oauth_failed`);
  }
};
