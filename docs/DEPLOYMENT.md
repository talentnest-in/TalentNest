# Deployment

## Frontend (Vercel)
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Routing**: `vercel.json` included for SPA fallback to `index.html`.

## Backend (Render)
- **Service**: Web Service (Node)
- **Config**: Managed via `render.yaml`.
- **Build**: `npm install && npx prisma generate && npm run build`
- **Start**: `npx prisma db push && node dist/index.js`

## Database
- PostgreSQL database hosted on Render/Neon.
- Schema synced automatically on server start via `prisma db push`.
