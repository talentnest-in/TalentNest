# System Design

## High Level Design
- **Client**: Web Browser interacting with React SPA hosted on Vercel.
- **Server**: Node.js/Fastify backend hosted on Render.
- **Database**: PostgreSQL database.

## Database
- Relational structure using PostgreSQL.
- Handled via Prisma ORM for type-safe queries.

## File Upload Flow
- Images (Avatars, Portfolios) and files (Resumes) are uploaded via `@fastify/multipart`.
- Saved to `public/uploads` directory.
- Served statically via `@fastify/static`.

## Authentication Flow
- Session maintained via `token` cookie.
- Token stores `userId` and `role`.
- Validated on protected routes using `server.authenticate` decorator.
