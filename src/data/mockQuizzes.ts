import { Quiz } from '@/types';

export const mockQuizzes: Quiz[] = [
  {
    id: 'quiz-1',
    title: 'Demo Quiz 1: Modern Web Engineering',
    description: 'Test your knowledge of modern web development concepts including React, TypeScript, and Next.js.',
    difficulty: 'medium',
    duration: 15,
    questionCount: 15,
    maxScore: 150,
    passingPercentage: 60,
    maxAttempts: 3,
    status: 'published',
    maxViolations: 3,
    fullscreenRequired: true,
    createdBy: '3c8a7095-ae6a-4e63-bf6a-97c8ce785c46',
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-02-15T10:00:00Z',
    attemptCount: 0,
  },
  {
    id: 'quiz-2',
    title: 'Demo Quiz 2: Data Structures & Algorithms',
    description: 'Core concepts of foundational data structures: arrays, linked lists, stacks, queues, trees, and algorithm complexity.',
    difficulty: 'hard',
    duration: 10,
    questionCount: 5,
    maxScore: 50,
    passingPercentage: 60,
    maxAttempts: 3,
    status: 'published',
    maxViolations: 3,
    fullscreenRequired: true,
    createdBy: '3c8a7095-ae6a-4e63-bf6a-97c8ce785c46',
    createdAt: '2024-02-05T10:00:00Z',
    updatedAt: '2024-02-20T11:00:00Z',
    attemptCount: 0,
  },
];

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  intermediate: 'Intermediate',
};
