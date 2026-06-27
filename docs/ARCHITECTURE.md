# Architecture

## Architecture Pattern
TalentNest uses a Client-Server architecture. The frontend is a Single Page Application (SPA) built with React, and the backend is a RESTful API built with Fastify.

## Frontend Architecture
- **Framework**: React with Vite.
- **State Management**: React Query for server state, React Context for global UI state (Theme, Auth).
- **Routing**: React Router DOM.
- **Styling**: Tailwind CSS with class-variance-authority for components.

## Backend Architecture
- **Framework**: Fastify.
- **Database Access**: Prisma ORM.
- **Structure**: Controller-Route pattern.
  - `routes/`: Defines API endpoints.
  - `controllers/`: Business logic and database interactions.
  - `lib/`: Shared utilities (Prisma client, File upload logic).

## Request Flow
Client -> API Route -> Controller -> Prisma -> PostgreSQL -> Response

## Authentication Flow
1. User submits credentials or uses OAuth.
2. Backend verifies and creates a JWT.
3. JWT is sent back as an HTTP-only Cookie.
4. Subsequent requests include the Cookie for authorization.
