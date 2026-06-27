# AI Handoff Document

## Project Vision
TalentNest is a modern freelance marketplace. It aims to be fast, responsive, and intuitive, built on a robust modern stack (React 19, Vite, Tailwind, Fastify, Prisma).

## Architecture Summary
- **Frontend**: React SPA, TanStack Query, Tailwind.
- **Backend**: Fastify API, Prisma ORM, PostgreSQL.
- **Auth**: JWT via HttpOnly Cookies + OAuth2.

## Important Decisions
- **File Uploads**: Currently local disk (`public/uploads`). Needs S3 migration.
- **Database Migrations**: We use `prisma db push` rather than `prisma migrate` for simplicity in the current phase. This is automated in `render.yaml`.
- **CORS**: Configured strictly. Environment variables must not have trailing slashes.

## Things that must NEVER be changed
- The JWT Cookie mechanism (Do not switch to localStorage for tokens).
- The Prisma schema base structure (UUIDs, Relations) without careful consideration.

## Next Sprint Focus
- Implementing the Job Application flow.
- Building the Messaging system.

*AI Agents: Read this document first to understand the context before modifying code.*
