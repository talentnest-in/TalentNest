FROM node:22-bookworm-slim AS frontend-builder

WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/tsconfig.json frontend/tsconfig.app.json frontend/tsconfig.node.json ./
COPY frontend/vite.config.ts frontend/postcss.config.js ./
COPY frontend/public/ ./public/
COPY frontend/src/ ./src/

ARG VITE_API_URL
ARG VITE_BACKEND_URL
ENV VITE_API_URL=${VITE_API_URL:-/api/v1}
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL:-http://localhost}

RUN npm run build


FROM nginx:alpine

RUN apk add --no-cache curl && mkdir -p /var/www/certbot

COPY --from=frontend-builder /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx/waf-rules.conf /etc/nginx/waf-rules.conf

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:80/ || curl -f http://localhost:80/api/v1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
