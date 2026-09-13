import { Question, QuestionFormData } from '@/types';
import { mockQuestions } from '@/data/mockQuestions';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

let questionsStore: Question[] = [...mockQuestions];

interface SupabaseQuestionRow {
  id: string;
  quiz_id: string;
  text: string;
  image: string | null;
  type: 'single' | 'multiple' | 'truefalse';
  options: { id: string; text: string }[];
  correct_answer: string | string[];
  marks: number;
  explanation: string | null;
  order_num: number;
  created_at: string;
  updated_at: string;
}

function mapRowToQuestion(row: SupabaseQuestionRow): Question {
  return {
    id: row.id,
    quizId: row.quiz_id,
    text: row.text,
    image: row.image || undefined,
    type: row.type,
    options: row.options || [],
    correctAnswer: row.correct_answer,
    marks: row.marks,
    explanation: row.explanation || undefined,
    order: row.order_num,
  };
}

function mapQuestionToRow(q: Partial<QuestionFormData & { id?: string; order?: number }>) {
  const row: Record<string, unknown> = {};
  if (q.id !== undefined) row.id = q.id;
  if (q.quizId !== undefined) row.quiz_id = q.quizId;
  if (q.text !== undefined) row.text = q.text;
  if (q.image !== undefined) row.image = q.image;
  if (q.type !== undefined) row.type = q.type;
  if (q.options !== undefined) row.options = q.options;
  if (q.correctAnswer !== undefined) row.correct_answer = q.correctAnswer;
  if (q.marks !== undefined) row.marks = q.marks;
  if (q.explanation !== undefined) row.explanation = q.explanation;
  if (q.order !== undefined) row.order_num = q.order;
  return row;
}

export const questionService = {
  getCachedByQuizId(quizId: string): Question[] {
    return questionsStore
      .filter((q) => q.quizId === quizId)
      .sort((a, b) => a.order - b.order);
  },

  async getByQuizId(quizId: string): Promise<Question[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', quizId)
          .order('order_num', { ascending: true });

        if (!error && data && data.length > 0) {
          const fresh = (data as SupabaseQuestionRow[]).map(mapRowToQuestion);
          const others = questionsStore.filter((q) => q.quizId !== quizId);
          questionsStore = [...others, ...fresh];
          return fresh;
        }
      } catch {
        // fallback
      }
    }

    return questionsStore
      .filter((q) => q.quizId === quizId)
      .sort((a, b) => a.order - b.order);
  },

  async getAll(): Promise<Question[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .order('order_num', { ascending: true });

        if (!error && data && data.length > 0) {
          return (data as SupabaseQuestionRow[]).map(mapRowToQuestion);
        }
      } catch {
        // fallback
      }
    }

    return [...questionsStore].sort((a, b) => a.order - b.order);
  },

  async getById(id: string): Promise<Question | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          return mapRowToQuestion(data as SupabaseQuestionRow);
        }
      } catch {
        // fallback
      }
    }

    return questionsStore.find((q) => q.id === id) ?? null;
  },

  async create(data: QuestionFormData): Promise<Question> {
    const id = `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newQuestion: Question = {
      ...data,
      id,
    };

    if (isSupabaseConfigured()) {
      try {
        const row = mapQuestionToRow(newQuestion);
        const { data: inserted, error } = await supabase
          .from('questions')
          .insert(row)
          .select()
          .maybeSingle();

        if (!error && inserted) {
          const created = mapRowToQuestion(inserted as SupabaseQuestionRow);
          questionsStore = [...questionsStore, created];
          return created;
        }
      } catch {
        // fallback
      }
    }

    questionsStore = [...questionsStore, newQuestion];
    return newQuestion;
  },

  async update(id: string, data: Partial<QuestionFormData>): Promise<Question> {
    const idx = questionsStore.findIndex((q) => q.id === id);
    const existing = idx !== -1 ? questionsStore[idx] : null;

    const updated: Question = {
      ...(existing || {
        id,
        quizId: data.quizId || '',
        text: '',
        type: 'single',
        options: [],
        correctAnswer: '',
        marks: 10,
        order: 1,
      }),
      ...data,
    };

    if (isSupabaseConfigured()) {
      try {
        const row = mapQuestionToRow(data);
        const { data: updatedRow, error } = await supabase
          .from('questions')
          .update(row)
          .eq('id', id)
          .select()
          .maybeSingle();

        if (!error && updatedRow) {
          const saved = mapRowToQuestion(updatedRow as SupabaseQuestionRow);
          if (idx !== -1) questionsStore[idx] = saved;
          return saved;
        }
      } catch {
        // fallback
      }
    }

    if (idx !== -1) {
      questionsStore[idx] = updated;
    }
    return updated;
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('questions').delete().eq('id', id);
      } catch {
        // fallback
      }
    }
    questionsStore = questionsStore.filter((q) => q.id !== id);
  },

  async deleteByQuizId(quizId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('questions').delete().eq('quiz_id', quizId);
      } catch {
        // fallback
      }
    }
    questionsStore = questionsStore.filter((q) => q.quizId !== quizId);
  },

  async duplicate(id: string): Promise<Question> {
    const original = await this.getById(id);
    if (!original) throw new Error('Question not found');
    const siblingQuestions = await this.getByQuizId(original.quizId);
    const maxOrder = Math.max(0, ...siblingQuestions.map((q) => q.order));

    const copyData: QuestionFormData = {
      quizId: original.quizId,
      text: `${original.text} (Copy)`,
      image: original.image,
      type: original.type,
      options: original.options,
      correctAnswer: original.correctAnswer,
      marks: original.marks,
      explanation: original.explanation,
      order: maxOrder + 1,
    };

    return this.create(copyData);
  },

  async reorder(quizId: string, orderedIds: string[]): Promise<void> {
    orderedIds.forEach((id, index) => {
      const idx = questionsStore.findIndex((q) => q.id === id && q.quizId === quizId);
      if (idx !== -1) questionsStore[idx] = { ...questionsStore[idx], order: index + 1 };
    });

    if (isSupabaseConfigured()) {
      try {
        const updates = orderedIds.map((id, index) =>
          supabase.from('questions').update({ order_num: index + 1 }).eq('id', id)
        );
        await Promise.all(updates);
      } catch {
        // fallback
      }
    }
  },

  async replaceForQuiz(quizId: string, questions: Question[]): Promise<Question[]> {
    questionsStore = questionsStore.filter((q) => q.quizId !== quizId);
    const formatted = questions.map((q, idx) => ({
      ...q,
      quizId,
      order: idx + 1,
    }));
    questionsStore = [...questionsStore, ...formatted];

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('questions').delete().eq('quiz_id', quizId);
        const rows = formatted.map(mapQuestionToRow);
        await supabase.from('questions').insert(rows);
      } catch {
        // fallback
      }
    }

    return formatted;
  },
};
