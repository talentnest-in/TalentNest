FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts && npm rebuild

COPY prisma/ ./prisma/
RUN npx prisma generate

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build


FROM node:22-bookworm-slim AS production

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
