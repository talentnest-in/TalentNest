// k6 Spike Test — Sudden traffic surge
// Run: k6 run load-tests/k6/spike-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },       // Normal
    { duration: '30s', target: 2000 },     // Spike!
    { duration: '5m', target: 2000 },      // Sustain
    { duration: '1m', target: 50 },        // Recovery
    { duration: '2m', target: 50 },        // Cool-down
  ],
  thresholds: {
    http_req_duration: ['p(90)<8000', 'p(99)<15000'],
    http_req_failed: ['rate<0.15'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  const res = http.get(`${BASE_URL}/health`);
  check(res, { 'health is ok': (r) => r.status === 200 });
  sleep(0.3);
}
