// ============================================================
// QUIZORA — TypeScript Types
// ============================================================

// --- AUTH / USER ---

export type UserRole = 'admin' | 'viewer' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// --- QUIZ ---

export type QuizDifficulty = 'easy' | 'medium' | 'hard';
export type QuizStatus = 'draft' | 'published' | 'closed';

export interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: QuizDifficulty;
  duration: number; // in minutes
  questionCount: number;
  maxScore: number;
  passingPercentage: number;
  maxAttempts: number;
  status: QuizStatus;
  maxViolations: number;
  fullscreenRequired: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  attemptCount: number;
}

export interface QuizFormData {
  title: string;
  description: string;
  difficulty: QuizDifficulty;
  duration: number;
  questionCount: number;
  maxScore: number;
  passingPercentage: number;
  maxAttempts: number;
  status: QuizStatus;
  maxViolations: number;
  fullscreenRequired: boolean;
}

// --- QUESTION ---

export type QuestionType = 'single' | 'multiple' | 'truefalse';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  quizId: string;
  text: string;
  image?: string;
  type: QuestionType;
  options: QuestionOption[];
  correctAnswer: string | string[]; // single option id or array of option ids
  marks: number;
  explanation?: string;
  order: number;
}

export interface QuestionFormData {
  quizId: string;
  text: string;
  image?: string;
  type: QuestionType;
  options: QuestionOption[];
  correctAnswer: string | string[];
  marks: number;
  explanation?: string;
  order: number;
}

// --- ATTEMPT ---

export type AttemptStatus = 'in_progress' | 'completed' | 'auto_submitted' | 'abandoned';

export interface AttemptAnswer {
  questionId: string;
  selectedAnswer: string | string[] | null;
  isMarkedForReview: boolean;
  timeSpent: number; // in seconds
}

export interface Attempt {
  id: string;
  userId: string;
  quizId: string;
  answers: AttemptAnswer[];
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  startedAt: string;
  submittedAt?: string;
  timeTaken?: number; // in seconds
  violations: ViolationRecord[];
  status: AttemptStatus;
}

// --- VIOLATIONS ---

export type ViolationType = 'tab_switch' | 'window_blur' | 'fullscreen_exit' | 'navigation_attempt';

export interface ViolationRecord {
  type: ViolationType;
  timestamp: string;
  description: string;
}

// --- PARTICIPANT ---

export interface Participant {
  id: string;
  userId: string;
  quizId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  status: 'not_attempted' | 'in_progress' | 'completed' | 'auto_submitted' | 'abandoned';
  score?: number;
  maxScore?: number;
  percentage?: number;
  passed?: boolean;
  startedAt?: string;
  submittedAt?: string;
  timeTaken?: number;
  violations?: number;
  attemptId?: string;
}

// --- RESULT / ANALYTICS ---

export interface QuizAnalytics {
  quizId: string;
  quizTitle: string;
  totalParticipants: number;
  attempted: number;
  notAttempted: number;
  inProgress: number;
  completed: number;
  averageScore: number;
  averagePercentage: number;
  passRate: number;
  averageTimeTaken: number;
  scoreDistribution: ScoreDistributionItem[];
  difficultyBreakdown: { correct: number; incorrect: number; unanswered: number };
}

export interface ScoreDistributionItem {
  range: string;
  count: number;
}

// --- TOAST ---

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// --- NAVIGATION ---

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}
