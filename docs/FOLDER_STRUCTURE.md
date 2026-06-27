# Folder Structure

## Root
- `/frontend` - React application
- `/backend` - Fastify API server
- `/docs` - Documentation
- `render.yaml` - Render deployment config

## Frontend (`/frontend/src`)
- `/assets` - Static assets (images, svgs)
- `/components` - Reusable UI elements (Atoms, Molecules)
  - `/auth` - Protected route wrappers
  - `/client` - Client-specific components
  - `/freelancer` - Freelancer-specific components
  - `/ui` - Base UI components (Button, Input, Modal)
- `/contexts` - React Contexts (Auth, Theme)
- `/lib` - Utilities (Axios instance, constants)
- `/pages` - Route components (Login, Dashboard, etc.)
- `/services` - API call wrappers
- `/types` - TypeScript definitions

## Backend (`/backend/src`)
- `/controllers` - Request handlers and business logic
- `/routes` - API route definitions
- `/lib` - Prisma instance, upload helpers
- `index.ts` - App entry point, plugin registration
- `../prisma/schema.prisma` - Database schema
