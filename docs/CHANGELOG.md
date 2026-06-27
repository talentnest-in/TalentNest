# Changelog

## [1.0.0-beta] - 2026-06-27

### Added
- Complete Client Profile and Company management.
- Job Posting CRUD operations.
- Dynamic OAuth Callback URLs based on environment.
- Vercel client-side routing config (`vercel.json`).
- Render deployment config (`render.yaml`).
- Prisma production migration script (`start:prod`).

### Changed
- CORS origin handling to strip trailing slashes.
- Portfolio and Company image URLs to use dynamic `BACKEND_URL`.
