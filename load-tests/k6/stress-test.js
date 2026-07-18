// k6 Stress Test — Push system to breaking point
// Run: k6 run load-tests/k6/stress-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },     // Normal load
    { duration: '2m', target: 500 },      // High load
    { duration: '2m', target: 1000 },     // Peak load
    { duration: '2m', target: 2000 },     // Stress
    { duration: '5m', target: 2000 },     // Sustained stress
    { duration: '2m', target: 0 },        // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(90)<5000', 'p(99)<10000'],
    http_req_failed: ['rate<0.10'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const AUTH_EMAIL = __ENV.AUTH_EMAIL || 'admin@talentnest.com';
const AUTH_PASSWORD = __ENV.AUTH_PASSWORD || 'admin123';

function getToken() {
  const res = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email: AUTH_EMAIL, password: AUTH_PASSWORD,
  }), { headers: { 'Content-Type': 'application/json' } });

  return res.status === 200 ? res.json('token') : null;
}

let cachedToken = '';

export default function () {
  if (!cachedToken) {
    cachedToken = getToken();
  }

  const headers = cachedToken
    ? { Authorization: `Bearer ${cachedToken}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };

  // Health
  http.get(`${BASE_URL}/health`, { tags: { name: 'health' } });

  // Jobs marketplace
  http.get(`${BASE_URL}/api/v1/jobs?page=1&limit=12`, { headers, tags: { name: 'jobs' } });

  // Auth me
  if (cachedToken) {
    http.get(`${BASE_URL}/api/v1/auth/me`, { headers, tags: { name: 'auth-me' } });
    http.get(`${BASE_URL}/api/v1/notifications`, { headers, tags: { name: 'notifications' } });
  }

  sleep(0.5);
}
