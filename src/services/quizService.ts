import { Quiz, QuizFormData, QuizStatus } from '@/types';
import { mockQuizzes } from '@/data/mockQuizzes';
import { isValidUuid } from '@/utils/formatters';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

let quizzesStore: Quiz[] = [...mockQuizzes];

interface SupabaseQuizRow {
  id: string;
  title: string;
  description: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number;
  question_count: number;
  max_score: number;
  passing_percentage: number;
  max_attempts: number;
  status: 'draft' | 'published' | 'closed';
  max_violations: number;
  fullscreen_required: boolean;
  created_by: string | null;
  attempt_count: number | null;
  created_at: string;
  updated_at: string;
}

function mapRowToQuiz(row: SupabaseQuizRow): Quiz {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    difficulty: row.difficulty,
    duration: row.duration,
    questionCount: row.question_count,
    maxScore: row.max_score,
    passingPercentage: row.passing_percentage,
    maxAttempts: row.max_attempts,
    status: row.status,
    maxViolations: row.max_violations,
    fullscreenRequired: row.fullscreen_required,
    createdBy: row.created_by || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    attemptCount: row.attempt_count || 0,
  };
}

function mapQuizToRow(quiz: Partial<QuizFormData & { id?: string; attemptCount?: number; createdBy?: string }>) {
  const row: Record<string, unknown> = {};
  if (quiz.id !== undefined) row.id = quiz.id;
  if (quiz.title !== undefined) row.title = quiz.title;
  if (quiz.description !== undefined) row.description = quiz.description;
  if (quiz.difficulty !== undefined) row.difficulty = quiz.difficulty;
  if (quiz.duration !== undefined) row.duration = quiz.duration;
  if (quiz.questionCount !== undefined) row.question_count = quiz.questionCount;
  if (quiz.maxScore !== undefined) row.max_score = quiz.maxScore;
  if (quiz.passingPercentage !== undefined) row.passing_percentage = quiz.passingPercentage;
  if (quiz.maxAttempts !== undefined) row.max_attempts = quiz.maxAttempts;
  if (quiz.status !== undefined) row.status = quiz.status;
  if (quiz.maxViolations !== undefined) row.max_violations = quiz.maxViolations;
  if (quiz.fullscreenRequired !== undefined) row.fullscreen_required = quiz.fullscreenRequired;
  if (quiz.createdBy !== undefined) row.created_by = isValidUuid(quiz.createdBy) ? quiz.createdBy : null;
  if (quiz.attemptCount !== undefined) row.attempt_count = quiz.attemptCount;
  return row;
}

let activeFetchAllPromise: Promise<Quiz[]> | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 30_000;

export const quizService = {
  getCachedAll(): Quiz[] {
    return [...quizzesStore];
  },

  getCachedPublished(): Quiz[] {
    return quizzesStore.filter((q) => q.status === 'published');
  },

  getCachedById(id: string): Quiz | null {
    return quizzesStore.find((q) => q.id === id) ?? null;
  },

  invalidateCache(): void {
    lastFetchTime = 0;
  },

  async getAll(force = false): Promise<Quiz[]> {
    if (!force && Date.now() - lastFetchTime < CACHE_TTL_MS && quizzesStore.length > 0) {
      return [...quizzesStore];
    }

    if (activeFetchAllPromise) {
      return activeFetchAllPromise;
    }

    activeFetchAllPromise = (async () => {
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('quizzes')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            quizzesStore = (data as SupabaseQuizRow[]).map(mapRowToQuiz);
            lastFetchTime = Date.now();
            return quizzesStore;
          }
        } catch {
          // fallback to store
        }
      }
      lastFetchTime = Date.now();
      return [...quizzesStore];
    })().finally(() => {
      activeFetchAllPromise = null;
    });

    return activeFetchAllPromise;
  },

  async getPublished(force = false): Promise<Quiz[]> {
    const all = await this.getAll(force);
    return all.filter((q) => q.status === 'published');
  },

  async getById(id: string): Promise<Quiz | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          return mapRowToQuiz(data as SupabaseQuizRow);
        }
      } catch {
        // fallback to store
      }
    }
    return quizzesStore.find((q) => q.id === id) ?? null;
  },

  async create(data: QuizFormData & { id?: string; createdBy?: string }): Promise<Quiz> {
    const id = data.id || `quiz-${Date.now()}`;
    const newQuiz: Quiz = {
      ...data,
      id,
      createdBy: data.createdBy && isValidUuid(data.createdBy) ? data.createdBy : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attemptCount: 0,
    };

    if (isSupabaseConfigured()) {
      try {
        const row = mapQuizToRow({ ...newQuiz });
        const { data: inserted, error } = await supabase
          .from('quizzes')
          .insert(row)
          .select()
          .maybeSingle();

        if (!error && inserted) {
          const created = mapRowToQuiz(inserted as SupabaseQuizRow);
          quizzesStore = [created, ...quizzesStore];
          return created;
        }
      } catch {
        // fallback
      }
    }

    quizzesStore = [newQuiz, ...quizzesStore];
    lastFetchTime = 0;
    return newQuiz;
  },

  async update(id: string, data: Partial<QuizFormData & { createdBy?: string }>): Promise<Quiz> {
    const idx = quizzesStore.findIndex((q) => q.id === id);
    const existing = idx !== -1 ? quizzesStore[idx] : null;

    const updated: Quiz = {
      ...(existing || {
        id,
        title: '',
        description: '',
        difficulty: 'medium',
        duration: 15,
        questionCount: 0,
        maxScore: 0,
        passingPercentage: 60,
        maxAttempts: 3,
        status: 'draft',
        maxViolations: 3,
        fullscreenRequired: true,
        createdAt: new Date().toISOString(),
        attemptCount: 0,
      }),
      ...data,
      createdBy: data.createdBy && isValidUuid(data.createdBy) ? data.createdBy : existing?.createdBy,
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const row = mapQuizToRow(data);
        const { data: updatedRow, error } = await supabase
          .from('quizzes')
          .update(row)
          .eq('id', id)
          .select()
          .maybeSingle();

        if (!error && updatedRow) {
          const saved = mapRowToQuiz(updatedRow as SupabaseQuizRow);
          if (idx !== -1) quizzesStore[idx] = saved;
          return saved;
        }
      } catch {
        // fallback
      }
    }

    if (idx !== -1) {
      quizzesStore[idx] = updated;
    }
    lastFetchTime = 0;
    return updated;
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('quizzes').delete().eq('id', id);
      } catch {
        // fallback
      }
    }
    quizzesStore = quizzesStore.filter((q) => q.id !== id);
    lastFetchTime = 0;
  },

  async publish(id: string): Promise<Quiz> {
    return this.update(id, { status: 'published' as QuizStatus });
  },

  async unpublish(id: string): Promise<Quiz> {
    return this.update(id, { status: 'draft' as QuizStatus });
  },

  async close(id: string): Promise<Quiz> {
    return this.update(id, { status: 'closed' as QuizStatus });
  },

  async duplicate(id: string): Promise<Quiz> {
    const original = await this.getById(id);
    if (!original) throw new Error('Quiz not found');

    const copyData: QuizFormData = {
      title: `${original.title} (Copy)`,
      description: original.description,
      difficulty: original.difficulty,
      duration: original.duration,
      questionCount: original.questionCount,
      maxScore: original.maxScore,
      passingPercentage: original.passingPercentage,
      maxAttempts: original.maxAttempts,
      status: 'draft',
      maxViolations: original.maxViolations,
      fullscreenRequired: original.fullscreenRequired,
    };

    return this.create(copyData);
  },

  incrementAttemptCount(id: string): void {
    const q = quizzesStore.find((item) => item.id === id);
    if (q) {
      q.attemptCount = (q.attemptCount || 0) + 1;
    }

    if (isSupabaseConfigured()) {
      (async () => {
        try {
          const { error } = await supabase.rpc('increment_quiz_attempt', { quiz_id: id });
          if (error && q) {
            await supabase.from('quizzes').update({ attempt_count: q.attemptCount }).eq('id', id);
          }
        } catch {
          if (q) {
            try {
              await supabase.from('quizzes').update({ attempt_count: q.attemptCount }).eq('id', id);
            } catch {
              // Ignore background update error
            }
          }
        }
      })();
    }
  },
};
