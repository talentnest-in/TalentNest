// k6 Load Test — Simulates real-world usage patterns
// Run: k6 run load-tests/k6/load-test.js
import http from 'k6/http';
import { check, sleep, group, randomSeed } from 'k6';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const STAGE = __ENV.STAGE || '100';

// Stage configurations
const STAGES = {
  '100':  { vus: 100, duration: '5m' },
  '500':  { vus: 500, duration: '10m' },
  '1000': { vus: 1000, duration: '15m' },
  '5000': { vus: 5000, duration: '30m' },
};

const config = STAGES[STAGE] || STAGES['100'];

export const options = {
  stages: [
    { duration: '1m', target: config.vus * 0.5 },    // Ramp-up to 50%
    { duration: config.duration, target: config.vus },  // Stay at target
    { duration: '1m', target: 0 },                      // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000', 'p(99)<5000'],
    http_req_failed: ['rate<0.05'],
    'http_req_duration{type:static}': ['p(95)<200'],
    'http_req_duration{type:api}': ['p(95)<3000'],
  },
};

// Reusable authenticated session
function createSession() {
  const email = `load-${randomString(8)}@test.com`;
  const password = 'TestPass123';

  const registerRes = http.post(`${BASE_URL}/api/v1/auth/register`, JSON.stringify({
    email, password, name: 'Load User', role: 'FREELANCER',
  }), { headers: { 'Content-Type': 'application/json' } });

  if (registerRes.status === 201) {
    return { token: registerRes.json('token'), email, password };
  }

  // Try login if user exists
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email, password,
  }), { headers: { 'Content-Type': 'application/json' } });

  return loginRes.status === 200
    ? { token: loginRes.json('token'), email, password }
    : null;
}

export default function () {
  randomSeed(Date.now() + __VU);

  group('API Requests', () => {
    // Health — lightweight, no auth
    const healthRes = http.get(`${BASE_URL}/health`, { tags: { type: 'api' } });
    check(healthRes, { 'health is 200': (r) => r.status === 200 });

    // Browse jobs (no auth)
    const jobsRes = http.get(`${BASE_URL}/api/v1/jobs?page=1&limit=12`, { tags: { type: 'api' } });
    check(jobsRes, { 'jobs list returns 401 (no auth)': (r) => r.status === 401 });

    // Authenticated flows
    const session = createSession();
    if (session) {
      const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      };

      // Get auth profile
      const meRes = http.get(`${BASE_URL}/api/v1/auth/me`, {
        headers: authHeaders,
        tags: { type: 'api' },
      });
      check(meRes, { 'auth/me is 200': (r) => r.status === 200 });

      // Browse jobs (authenticated)
      const authJobsRes = http.get(`${BASE_URL}/api/v1/jobs?page=${randomIntBetween(1, 5)}&limit=12`, {
        headers: authHeaders,
        tags: { type: 'api' },
      });
      check(authJobsRes, { 'auth jobs is 200': (r) => r.status === 200 });

      // Get notifications
      const notifRes = http.get(`${BASE_URL}/api/v1/notifications?page=1&limit=10`, {
        headers: authHeaders,
        tags: { type: 'api' },
      });
      check(notifRes, { 'notifications is 200': (r) => r.status === 200 });
    }

    // Metrics (no auth, lightweight)
    const metricsRes = http.get(`${BASE_URL}/metrics`, { tags: { type: 'static' } });
    check(metricsRes, { 'metrics is 200': (r) => r.status === 200 });
  });

  sleep(randomIntBetween(1, 3));
}
