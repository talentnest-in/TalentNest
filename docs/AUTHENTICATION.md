# Authentication

TalentNest uses a hybrid Authentication model supporting Local (Email/Password) and OAuth (Google, GitHub).

## JWT & Cookies
- Fastify generates a JWT upon successful login.
- The JWT is stored in an `HttpOnly` cookie to prevent XSS attacks.
- `server.authenticate` middleware verifies the cookie on protected routes.

## OAuth
- Uses `@fastify/oauth2`.
- Redirection to provider (Google/GitHub).
- Callback endpoint fetches user profile.
- Upserts user into the database based on `provider` + `providerId` or `email`.
- Issues JWT cookie and redirects to frontend `/oauth/callback`.

## Role System
- Users start with `role = null` (Needs Onboarding).
- Onboarding selects `FREELANCER` or `CLIENT`.
- Frontend `ProtectedRoute` components restrict access based on the assigned role.
