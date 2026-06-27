/**
 * Backend base URL — resolves from environment variables.
 *
 * Development : http://localhost:3001          (via VITE_BACKEND_URL or fallback)
 * Production  : https://talentnest-zrk2.onrender.com  (set VITE_BACKEND_URL in Vercel/Netlify)
 *
 * NOTE: No trailing slash.
 */
export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * API base URL — used by the Axios instance in api.ts.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || `${BACKEND_URL}/api/v1`;
