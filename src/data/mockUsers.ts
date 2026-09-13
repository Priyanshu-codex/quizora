import { User } from '@/types';

export const DEMO_ADMIN_ID = 'a1111111-1111-4111-a111-111111111111';
export const DEMO_VIEWER_ID = 'b2222222-2222-4222-b222-222222222222';
export const DEMO_USER_ID = 'c3333333-3333-4333-c333-333333333333';

export const mockUsers: User[] = [
  {
    id: DEMO_ADMIN_ID,
    name: 'Priyanshu Sharma',
    email: 'admin@quizora.dev',
    role: 'admin',
    avatar: undefined,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: DEMO_VIEWER_ID,
    name: 'Ananya Singh',
    email: 'viewer@quizora.dev',
    role: 'viewer',
    avatar: undefined,
    createdAt: '2024-01-02T00:00:00Z',
  },
  {
    id: DEMO_USER_ID,
    name: 'Aarav Sharma',
    email: 'user@quizora.dev',
    role: 'user',
    avatar: undefined,
    createdAt: '2024-01-03T00:00:00Z',
  },
];

export const AUTH_ACCOUNTS = {
  admin: { email: 'admin@quizora.dev', password: 'Admin@csit', role: 'admin' as const },
  viewer: { email: 'viewer@quizora.dev', password: 'Viewer@csit', role: 'viewer' as const },
  user: { email: 'user@quizora.dev', password: 'Password@123', role: 'user' as const },
};

export const DEMO_CREDENTIALS = AUTH_ACCOUNTS;
