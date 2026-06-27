# Security

## Authentication
- HTTP-Only Cookies used to store JWTs.
- Passwords hashed using `bcryptjs`.

## Middleware
- **Helmet**: Secures HTTP headers (`@fastify/helmet`).
- **CORS**: Restricted origins (`@fastify/cors`).
- **Rate Limiting**: Protects against brute force (`@fastify/rate-limit`).

## Validation
- **Zod**: Validates all incoming request bodies and query parameters on the backend.
- Prevents NoSQL/SQL injection by ensuring strict type schemas before reaching Prisma.

## File Uploads
- File size limits enforced (10MB).
- Only specific routes accept multipart forms.
