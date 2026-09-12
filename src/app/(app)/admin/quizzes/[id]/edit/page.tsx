'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { quizService } from '@/services/quizService';
import { questionService } from '@/services/questionService';
import { Quiz, Question } from '@/types';
import QuizBuilderEngine from '@/components/quiz/QuizBuilderEngine';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditQuizPage({ params }: Props) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(async ({ id }) => {
      const [q, qs] = await Promise.all([quizService.getById(id), questionService.getByQuizId(id)]);
      if (!q) {
        router.replace('/admin/quizzes');
        return;
      }
      setQuiz(q);
      setQuestions(qs);
      setLoading(false);
    });
  }, [params, router]);

  if (loading || !quiz) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[1, 2].map((i) => (
          <div key={i} className="skeleton" style={{ height: 220, borderRadius: 'var(--radius-lg)' }} />
        ))}
      </div>
    );
  }

  return <QuizBuilderEngine initialQuiz={quiz} initialQuestions={questions} isEditing />;
}
