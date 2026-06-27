# TalentNest

## Project Overview
TalentNest is a modern freelance and job board platform connecting freelancers with clients. It features user authentication, role-based dashboards, portfolio management, and job postings.

## Features
- **User Authentication**: Email/Password, Google OAuth, GitHub OAuth.
- **Role-based Access**: Freelancer, Client, and Admin roles.
- **Freelancer Dashboard**: Manage profile, skills, education, experience, and portfolio projects.
- **Client Dashboard**: Manage company profile and post jobs.
- **Job Management**: Browse, create, edit, and apply for jobs (Fixed & Hourly).

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, TanStack Query, React Hook Form, Zod.
- **Backend**: Fastify, Prisma ORM, PostgreSQL.
- **Deployment**: Vercel (Frontend), Render (Backend), PostgreSQL.

## Folder Structure
- `frontend/`: React SPA.
- `backend/`: Fastify API.
- `docs/`: Project Documentation.

## Running Locally
1. Clone the repository.
2. Setup `backend/.env` and `frontend/.env`.
3. Backend: `cd backend && npm i && npm run dev`
4. Frontend: `cd frontend && npm i && npm run dev`
