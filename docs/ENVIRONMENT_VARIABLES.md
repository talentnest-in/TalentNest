# Environment Variables

## Backend (`backend/.env`)
- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: Secret for signing JWT tokens.
- `COOKIE_SECRET`: Secret for signing cookies.
- `FRONTEND_URL`: CORS origin and OAuth redirect target.
- `BACKEND_URL`: Dynamic callback URL for OAuth in production.
- `GOOGLE_CLIENT_ID` & `SECRET`: Google OAuth credentials.
- `GITHUB_CLIENT_ID` & `SECRET`: GitHub OAuth credentials.

## Frontend (`frontend/.env`, `frontend/.env.production`)
- `VITE_API_URL`: The base URL for API requests.
- `VITE_BACKEND_URL`: The base URL for static assets (images, resumes).
