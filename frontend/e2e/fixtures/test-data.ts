import { v4 as uuid } from 'uuid';

export function generateTestUser(role: 'FREELANCER' | 'CLIENT' = 'FREELANCER') {
  const id = uuid().slice(0, 8);
  return {
    name: `Test ${role} ${id}`,
    email: `e2e-${id}@test.talentnest.com`,
    password: 'TestPass123',
    role,
  };
}

export function generateTestJob() {
  const id = uuid().slice(0, 8);
  return {
    title: `E2E Test Job ${id}`,
    description: `This is an automated test job created by E2E tests. ID: ${id}`,
    type: 'FIXED',
    budget: 5000,
    skills: ['TypeScript', 'React', 'Node.js'],
  };
}

export const TEST_TIMEOUTS = {
  NAVIGATION: 15000,
  NETWORK: 10000,
  RENDER: 5000,
  ACTION: 3000,
};
