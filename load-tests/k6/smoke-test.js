// k6 Smoke Test — Validate core endpoints
// Run: k6 run load-tests/k6/smoke-test.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/health`);
    check(res, {
      'health status is 200': (r) => r.status === 200,
      'database is connected': (r) => r.json('database') === 'connected',
      'response time OK': (r) => r.timings.duration < 500,
    });
  });

  group('Metrics Endpoint', () => {
    const res = http.get(`${BASE_URL}/metrics`);
    check(res, {
      'metrics status is 200': (r) => r.status === 200,
      'contains prometheus data': (r) => r.body.includes('talentnest_'),
    });
  });

  group('Auth Endpoints', () => {
    const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
      email: 'test@example.com',
      password: 'invalid',
    }), { headers: { 'Content-Type': 'application/json' } });

    check(loginRes, {
      'login returns 401 for invalid credentials': (r) => r.status === 401,
    });

    const registerRes = http.post(`${BASE_URL}/api/v1/auth/register`, JSON.stringify({
      email: `loadtest-${Date.now()}@example.com`,
      password: 'TestPass123',
      name: 'Load Test User',
      role: 'FREELANCER',
    }), { headers: { 'Content-Type': 'application/json' } });

    check(registerRes, {
      'register returns 201': (r) => r.status === 201,
      'register returns token': (r) => r.json('token') !== undefined,
    });
  });

  sleep(1);
}
