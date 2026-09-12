import { Attempt, AttemptAnswer, AttemptStatus, ViolationRecord } from '@/types';
import { mockAttempts } from '@/data/mockAttempts';
import { questionService } from './questionService';
import { quizService } from './quizService';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

const ACTIVE_ATTEMPT_KEY = 'quizora_active_attempt';
const ALL_ATTEMPTS_KEY = 'quizora_all_attempts';

interface SupabaseAttemptRow {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  started_at: string;
  submitted_at: string | null;
  time_taken: number | null;
  violations: ViolationRecord[] | null;
  status: AttemptStatus;
  created_at: string;
}

interface SupabaseAnswerRow {
  attempt_id: string;
  question_id: string;
  selected_answer: string | string[] | null;
  is_marked_for_review: boolean;
  time_spent: number;
}

function mapRowToAttempt(row: SupabaseAttemptRow, answers: AttemptAnswer[] = []): Attempt {
  return {
    id: row.id,
    userId: row.user_id,
    quizId: row.quiz_id,
    answers,
    score: row.score || 0,
    maxScore: row.max_score || 0,
    percentage: Number(row.percentage) || 0,
    passed: Boolean(row.passed),
    startedAt: row.started_at,
    submittedAt: row.submitted_at || undefined,
    timeTaken: row.time_taken || undefined,
    violations: row.violations || [],
    status: row.status,
  };
}

function getStoredAttempts(): Attempt[] {
  if (typeof window === 'undefined') return [...mockAttempts];
  try {
    const raw = localStorage.getItem(ALL_ATTEMPTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [...mockAttempts];
}

let attemptsStore: Attempt[] = getStoredAttempts();

function syncStoredAttempts(attempts: Attempt[]): void {
  attemptsStore = attempts;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ALL_ATTEMPTS_KEY, JSON.stringify(attempts));
    } catch {
      // ignore
    }
  }
}

function refreshAttempts(): Attempt[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(ALL_ATTEMPTS_KEY);
      if (raw) {
        attemptsStore = JSON.parse(raw);
      }
    } catch {
      // ignore
    }
  }
  return attemptsStore;
}

export const attemptService = {
  async getAll(): Promise<Attempt[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('attempts')
          .select('*')
          .order('started_at', { ascending: false });

        if (!error && data) {
          const rows = data as SupabaseAttemptRow[];
          const attempts = rows.map((r) => mapRowToAttempt(r, []));
          syncStoredAttempts(attempts);
          return attempts;
        }
      } catch {
        // fallback
      }
    }
    return refreshAttempts();
  },

  async startAttempt(userId: string, quizId: string): Promise<Attempt> {
    const id = `attempt-${Date.now()}`;
    const startedAt = new Date().toISOString();

    const attempt: Attempt = {
      id,
      userId,
      quizId,
      answers: [],
      score: 0,
      maxScore: 0,
      percentage: 0,
      passed: false,
      startedAt,
      violations: [],
      status: 'in_progress',
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('attempts').insert({
          id,
          user_id: userId,
          quiz_id: quizId,
          score: 0,
          max_score: 0,
          percentage: 0,
          passed: false,
          started_at: startedAt,
          violations: [],
          status: 'in_progress',
        });
      } catch {
        // fallback to local
      }
    }

    const current = refreshAttempts();
    syncStoredAttempts([attempt, ...current]);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_ATTEMPT_KEY, JSON.stringify(attempt));
    }
    return attempt;
  },

  async saveAnswer(attemptId: string, answer: AttemptAnswer): Promise<void> {
    const current = [...refreshAttempts()];
    const idx = current.findIndex((a) => a.id === attemptId);
    if (idx !== -1) {
      const attempt = { ...current[idx] };
      const answerIdx = attempt.answers.findIndex((a) => a.questionId === answer.questionId);
      if (answerIdx === -1) {
        attempt.answers = [...attempt.answers, answer];
      } else {
        attempt.answers = attempt.answers.map((ans, i) => (i === answerIdx ? answer : ans));
      }
      current[idx] = attempt;
      syncStoredAttempts(current);
      if (typeof window !== 'undefined') {
        localStorage.setItem(ACTIVE_ATTEMPT_KEY, JSON.stringify(attempt));
      }
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('attempt_answers').upsert(
          {
            attempt_id: attemptId,
            question_id: answer.questionId,
            selected_answer: answer.selectedAnswer,
            is_marked_for_review: answer.isMarkedForReview,
            time_spent: answer.timeSpent,
          },
          { onConflict: 'attempt_id,question_id' }
        );
      } catch {
        // fallback
      }
    }
  },

  async recordViolation(attemptId: string, violation: ViolationRecord): Promise<void> {
    const current = [...refreshAttempts()];
    const idx = current.findIndex((a) => a.id === attemptId);
    if (idx !== -1) {
      const updatedViolations = [...current[idx].violations, violation];
      current[idx] = {
        ...current[idx],
        violations: updatedViolations,
      };
      syncStoredAttempts(current);
      if (typeof window !== 'undefined') {
        const active = JSON.parse(localStorage.getItem(ACTIVE_ATTEMPT_KEY) || '{}');
        if (active.id === attemptId) {
          active.violations = updatedViolations;
          localStorage.setItem(ACTIVE_ATTEMPT_KEY, JSON.stringify(active));
        }
      }

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('attempts').update({ violations: updatedViolations }).eq('id', attemptId);
        } catch {
          // fallback
        }
      }
    }
  },

  async submitAttempt(attemptId: string, status: AttemptStatus = 'completed'): Promise<Attempt> {
    const current = [...refreshAttempts()];
    const idx = current.findIndex((a) => a.id === attemptId);
    if (idx === -1) throw new Error('Attempt not found');

    const attempt = current[idx];
    const questions = await questionService.getByQuizId(attempt.quizId);

    let score = 0;
    let maxScore = 0;

    for (const question of questions) {
      maxScore += question.marks;
      const ans = attempt.answers.find((a) => a.questionId === question.id);
      if (!ans || ans.selectedAnswer === null) continue;

      if (question.type === 'multiple') {
        const correct = Array.isArray(question.correctAnswer) ? [...question.correctAnswer].sort() : [question.correctAnswer];
        const selected = Array.isArray(ans.selectedAnswer) ? [...ans.selectedAnswer].sort() : [ans.selectedAnswer];
        if (JSON.stringify(correct) === JSON.stringify(selected)) score += question.marks;
      } else {
        if (ans.selectedAnswer === question.correctAnswer) score += question.marks;
      }
    }

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100 * 10) / 10 : 0;
    const startTime = new Date(attempt.startedAt).getTime();
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const submittedAt = new Date().toISOString();

    const updated: Attempt = {
      ...attempt,
      score,
      maxScore,
      percentage,
      passed: percentage >= 60,
      submittedAt,
      timeTaken,
      status,
    };

    current[idx] = updated;
    syncStoredAttempts(current);
    quizService.incrementAttemptCount(attempt.quizId);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('attempts').update({
          score,
          max_score: maxScore,
          percentage,
          passed: percentage >= 60,
          submitted_at: submittedAt,
          time_taken: timeTaken,
          status,
        }).eq('id', attemptId);
      } catch {
        // fallback
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACTIVE_ATTEMPT_KEY);
      localStorage.setItem(`quizora_result_${attemptId}`, JSON.stringify(updated));
    }

    return updated;
  },

  async getByUserId(userId: string): Promise<Attempt[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('attempts')
          .select('*')
          .eq('user_id', userId)
          .order('started_at', { ascending: false });

        if (!error && data) {
          return (data as SupabaseAttemptRow[]).map((r) => mapRowToAttempt(r, []));
        }
      } catch {
        // fallback
      }
    }
    return refreshAttempts().filter((a) => a.userId === userId);
  },

  async getByQuizId(quizId: string): Promise<Attempt[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('attempts')
          .select('*')
          .eq('quiz_id', quizId)
          .order('started_at', { ascending: false });

        if (!error && data) {
          return (data as SupabaseAttemptRow[]).map((r) => mapRowToAttempt(r, []));
        }
      } catch {
        // fallback
      }
    }
    return refreshAttempts().filter((a) => a.quizId === quizId);
  },

  async getById(id: string): Promise<Attempt | null> {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`quizora_result_${id}`);
      if (cached) return JSON.parse(cached);
    }

    if (isSupabaseConfigured()) {
      try {
        const { data: attemptRow, error } = await supabase
          .from('attempts')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && attemptRow) {
          // Fetch answers
          const { data: answerRows } = await supabase
            .from('attempt_answers')
            .select('*')
            .eq('attempt_id', id);

          const answers: AttemptAnswer[] = (answerRows as SupabaseAnswerRow[] || []).map((ans) => ({
            questionId: ans.question_id,
            selectedAnswer: ans.selected_answer,
            isMarkedForReview: ans.is_marked_for_review,
            timeSpent: ans.time_spent,
          }));

          return mapRowToAttempt(attemptRow as SupabaseAttemptRow, answers);
        }
      } catch {
        // fallback
      }
    }

    return refreshAttempts().find((a) => a.id === id) ?? null;
  },

  getActiveAttempt(): Attempt | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(ACTIVE_ATTEMPT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async getAttemptsByUser(userId: string, quizId: string): Promise<Attempt[]> {
    const attempts = await this.getByUserId(userId);
    return attempts.filter((a) => a.quizId === quizId);
  },
};
