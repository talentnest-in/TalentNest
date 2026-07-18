FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts postcss.config.js ./
COPY public/ ./public/
COPY src/ ./src/

ARG VITE_API_URL
ARG VITE_BACKEND_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}

RUN npm run build


FROM nginx:alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
