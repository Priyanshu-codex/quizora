import { User } from '@/types';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Priyanshu Sharma',
    email: 'admin@quizora.dev',
    role: 'admin',
    avatar: undefined,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    name: 'Ananya Singh',
    email: 'viewer@quizora.dev',
    role: 'viewer',
    avatar: undefined,
    createdAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'user-3',
    name: 'Aarav Sharma',
    email: 'user@quizora.dev',
    role: 'user',
    avatar: undefined,
    createdAt: '2024-01-03T00:00:00Z',
  },
];

export const DEMO_CREDENTIALS = {
  admin: { email: 'admin@quizora.dev', password: 'demo1234', role: 'admin' as const },
  viewer: { email: 'viewer@quizora.dev', password: 'demo1234', role: 'viewer' as const },
  user: { email: 'user@quizora.dev', password: 'demo1234', role: 'user' as const },
};
