# TalentNest

A production-ready freelancing platform connecting talent with opportunity. Built with React 19, Fastify 5, PostgreSQL, and Redis.

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Nginx      │────▶│   Backend    │────▶│  PostgreSQL  │
│  React SPA   │     │  Gateway     │     │  Fastify API │     │  16-alpine   │
│  Port :5173  │     │  Port :80    │     │  Port :3001  │     │  Port :5432  │
└──────────────┘     └──────┬───────┘     └──────┬───────┘     └──────────────┘
                            │                     │
                     ┌──────▼───────┐      ┌──────▼───────┐
                     │   Redis 7    │      │   BullMQ     │
                     │  Cache/Q     │      │  Workers x7  │
                     └──────────────┘      └──────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript 6, Vite 8, Tailwind CSS 4, TanStack Query 5, React Router 7, Framer Motion, Socket.IO Client |
| **Backend** | Node.js 22, Fastify 5, TypeScript 6, Prisma 7 ORM |
| **Database** | PostgreSQL 16 |
| **Cache & Queue** | Redis 7 (BullMQ for background jobs) |
| **Storage** | Cloudinary (images, videos, documents) |
| **Real-time** | Socket.IO v4 (chat, notifications) |
| **Auth** | JWT + HttpOnly cookies, Google OAuth, GitHub OAuth |
| **Monitoring** | Prometheus metrics, OpenTelemetry tracing, Pino logging |
| **Infrastructure** | Docker Compose, PM2 cluster mode, Nginx reverse proxy |
| **CI/CD** | Vitest (backend), Vitest + React Testing Library (frontend), Playwright (E2E) |

## Quick Start (Docker)

```bash
# Prerequisites: Docker Engine 24+, Docker Compose v2+
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost:3001 |
| Health Check | http://localhost:3001/health |
| Metrics | http://localhost:3001/metrics |

## Local Development

### Prerequisites
- Node.js 22+
- PostgreSQL 16+
- Redis 7+

### Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run dev     # http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
```

## Environment Configuration

| File | Purpose |
|------|---------|
| `.env.development` | Local dev defaults (committed) |
| `.env.production` | Production template (committed) |
| `.env` | Active config (gitignored) |

## Feature Modules

### Core Platform
- **Authentication** — Email/password, OAuth (Google, GitHub), JWT + HttpOnly cookies, silent token refresh
- **User Roles** — Freelancer, Client, Admin — each with dedicated dashboards
- **Onboarding Wizard** — Step-by-step profile setup after registration

### Freelancer Features
- Profile management (skills, experience, education, portfolio)
- Job marketplace with search, filter, and sort
- Saved jobs, job applications with status tracking
- Contract management with milestones and workspace
- Offers (send, receive, accept/decline)

### Client Features
- Company profile management
- Job posting (create, edit, draft/publish)
- Applicant review and management
- Offer creation and contract management

### Academy (E-Learning)
- Course marketplace with browsing and search
- Course creation for creators (sections, lessons, video)
- Enrollment with lesson progress tracking
- Certificate generation and public verification
- Course reviews and ratings

### Community
- Communities (create, join, manage)
- Posts with likes and comments
- Real-time updates via Socket.IO

### Contests
- Contest creation and management
- Submissions and judging
- Winner selection and prize management

### Gamification
- Experience points (XP) and leveling
- Achievements and badges
- Leaderboards (daily/weekly/all-time)
- Missions and challenges
- Streak tracking

### Communication
- Real-time chat with Socket.IO
- Notifications (in-app + email)
- Contract workspaces with file sharing

## Background Jobs (BullMQ)

7 workers process tasks asynchronously via Redis:

| Queue | Concurrency | Purpose |
|-------|-------------|---------|
| Email | 3 | Welcome, password reset, verification emails |
| Notification | 10 | DB notification + real-time Socket.IO push |
| Gamification | 5 | XP awards, achievements, streaks, missions |
| Leaderboard | 2 | Rank recalculation per category/period |
| Badge | 3 | Condition evaluation and badge creation |
| Analytics | 2 | Course/platform analytics aggregation |
| Recommendation | 1 | Course recommendations by user skills |

**Retry policy**: 3 attempts, exponential backoff (2s base), DLQ retains failed jobs for 24h.

## API Endpoints

| Prefix | Module |
|--------|--------|
| `/api/v1/auth` | Authentication (register, login, OAuth, password reset) |
| `/api/v1/freelancers` | Freelancer profiles, skills, experience, education |
| `/api/v1/clients` | Client profiles, company, dashboard |
| `/api/v1/jobs` | Job marketplace (browse, search, recommended) |
| `/api/v1/client/jobs` | Client job CRUD |
| `/api/v1/jobs/:id/apply` | Job applications |
| `/api/v1/offers` | Offer management |
| `/api/v1/contracts` | Contracts, milestones, workspace |
| `/api/v1/chat` | Conversations, messages |
| `/api/v1/notifications` | User notifications |
| `/api/v1/admin` | Admin dashboard, users, finance, moderation |
| `/api/v1/academy` | Courses, lessons, enrollment, certificates |
| `/api/v1/community` | Communities, posts |
| `/api/v1/contests` | Contest management |
| `/api/v1/gamification` | XP, badges, leaderboards, missions |
| `/api/v1/search` | Global search |
| `/health` | Health check |
| `/metrics` | Prometheus metrics |

## Security

- **WAF Rules** — SQL injection, XSS, path traversal, command injection blocking
- **Rate Limiting** — Per-IP (nginx) + per-user (backend) + Redis-backed
- **Helmet** — Security headers (CSP, HSTS, X-Frame-Options, etc.)
- **Input Validation** — Zod schemas on every endpoint
- **Auth** — JWT with HttpOnly cookies, silent refresh, OAuth 2.0
- **File Upload** — MIME whitelist, extension blacklist, size limits
- **CORS** — Strict origin allowlist
- **Secrets** — All credentials via environment variables, never committed

## Performance Optimizations

- Response compression (gzip, 1KB threshold)
- 10+ composite database indexes
- Cursor pagination for large datasets
- Batch query helpers (`batchLoad`, `batchInclude`)
- Redis caching with cache warming on startup
- React lazy loading (code splitting by route)
- React.memo on frequently re-rendered components
- TanStack Query: placeholder data + stale time for smooth UX
- BullMQ background jobs for non-critical work

## Testing

```bash
# Backend unit/integration tests
cd backend && npm test

# Backend tests with watch mode
cd backend && npm run test:watch

# Frontend component tests
cd frontend && npx vitest run

# E2E tests (requires running app)
cd frontend && npx playwright test

# E2E with UI mode
cd frontend && npx playwright test --ui
```

### Test Coverage

| Suite | Tests | Description |
|-------|-------|-------------|
| Auth Service | 7 | Register, login, forgot password, profile |
| Cache Service | 4 | Redis get/set/invalidate/getOrFetch |
| Notification Service | 4 | List, mark read, delete with auth |
| Queue Workers | 4 | Email, notification, gamification, badge, leaderboard |
| Login Page (FE) | 3 | Form rendering, links, forgot password |
| Signup Page (FE) | 2 | Form rendering, role selection |
| JobCard (FE) | 8 | Title, company, budget, skills, badges, save button |
| E2E Auth | 9 | Login page, signup page, validation, navigation, credential rejection |
| E2E Jobs | 2 | Unauthenticated redirect, job detail access |
| E2E Health | 2 | App shell load, page title |

## Production Deployment

### Prerequisites
1. Domain name with DNS pointing to your server
2. Server with Docker Engine 24+ (preferably 2+ CPU cores, 4GB+ RAM)
3. SSL certificate (Let's Encrypt via certbot container)

### Steps

```bash
# 1. Configure production environment
cp .env.production .env
# Edit .env with real secrets and domain URLs

# 2. Obtain SSL certificate
docker compose --profile certbot run certbot certonly \
  --webroot -w /var/www/certbot \
  -d your-domain.com \
  --email your-email@example.com \
  --agree-tos --non-interactive

# 3. Update nginx/nginx.conf:
#    - Uncomment the HTTPS server block
#    - Replace 'your-domain.com' with your actual domain
#    - Set ssl_certificate paths to /etc/letsencrypt/live/your-domain/

# 4. Build and start
docker compose up --build -d

# 5. Set up SSL auto-renewal cron
docker compose --profile certbot run certbot renew
```

### PM2 Cluster Mode (Non-Docker)

```bash
cd backend
npm run start:pm2   # Cluster mode on all CPU cores
npm run pm2:status  # Check cluster health
npm run pm2:logs    # View logs
npm run pm2:monit   # Monitor dashboard
```

## Docker Compose Profiles

| Profile | Services | Purpose |
|---------|----------|---------|
| (default) | nginx, backend, redis, postgres | Core services |
| `certbot` | certbot | SSL certificate management |
| `sentinel` | 3 sentinels + 2 replicas | Redis HA (add to compose command) |

## Project Structure

```
talentnest/
├── backend/
│   ├── prisma/            # Schema and migrations
│   ├── src/
│   │   ├── controllers/   # HTTP handlers (thin)
│   │   ├── services/      # Business logic
│   │   ├── routes/        # Route definitions
│   │   ├── workers/       # BullMQ background workers (7)
│   │   ├── plugins/       # Fastify plugins (Socket.IO)
│   │   ├── lib/           # Utilities (queue, cache, redis, cloudinary)
│   │   ├── __tests__/     # Backend tests
│   │   └── index.ts       # Server entry point
│   ├── scripts/           # PM2 scripts
│   ├── ecosystem.config.js
│   └── vitest.config.ts
├── frontend/
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Route pages (lazy-loaded)
│   │   ├── services/      # API client services
│   │   ├── contexts/      # React contexts (Auth, Socket, Theme)
│   │   ├── lib/           # Utilities (api client, query keys)
│   │   ├── types/         # TypeScript interfaces
│   │   ├── __tests__/     # Frontend component tests
│   │   └── main.tsx       # App entry point
│   ├── e2e/               # Playwright E2E tests
│   ├── playwright.config.ts
│   └── vitest.config.ts
├── nginx/                 # Nginx config (WAF, HTTPS, rate limiting)
├── docs/                  # Additional documentation
├── docker-compose.yml     # Main compose file
├── docker-compose.sentinel.yml  # Redis HA compose file
└── .env.development / .env.production
```

## Monitoring

- **Health**: `GET /health` — DB, Redis, Socket.IO, queue worker status
- **Metrics**: `GET /metrics` — Prometheus format (request count, duration, active connections)
- **Logs**: Structured JSON via Pino, redacted secrets, request ID tracing
- **Tracing**: OpenTelemetry with OTLP exporter
- **PM2**: Status, logs, and monitoring dashboard

## Troubleshooting

### Database connection refused
Docker Compose uses `depends_on: condition: service_healthy` to enforce ordering. Ensure PostgreSQL is healthy before the backend starts.

### Frontend can't reach API
The frontend's `VITE_API_URL` is baked at build time. Rebuild with `docker compose build frontend` if the URL changes.

### Permission denied for docker-entrypoint.sh
Run `chmod +x backend/docker-entrypoint.sh` on Linux/Mac. Docker Desktop on Windows syncs permissions automatically.

### Redis connection failures
The application gracefully degrades — caching and rate limiting fall back to in-memory mode. Check `REDIS_PASSWORD` and `REDIS_HOST` in `.env`.

### Upload failures
Verify `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are set. Supports images (≤10MB), videos (≤200MB), and documents (≤50MB).
