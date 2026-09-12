'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, BookOpen, Clock, Award, ShieldCheck, CheckCircle2, Copy, Trash2 } from 'lucide-react';
import { quizService } from '@/services/quizService';
import { questionService } from '@/services/questionService';
import { Quiz, Question } from '@/types';
import { formatDuration, difficultyColor, difficultyLabel, statusColor, statusLabel } from '@/utils/formatters';
import { useToast } from '@/context/ToastContext';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Link from 'next/link';

export default function AdminViewQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { success, error } = useToast();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      quizService.getById(id),
      questionService.getByQuizId(id),
    ]).then(([q, qList]) => {
      if (!q) {
        router.replace('/admin/quizzes');
        return;
      }
      setQuiz(q);
      setQuestions(qList);
      setLoading(false);
    });
  }, [id, router]);

  async function handleDuplicate() {
    if (!quiz) return;
    try {
      const copy = await quizService.duplicate(quiz.id);
      success('Quiz duplicated', 'A draft copy has been created.');
      router.push(`/admin/quizzes/${copy.id}/edit`);
    } catch (err: unknown) {
      error('Duplicate failed', (err as Error)?.message);
    }
  }

  async function handleDelete() {
    if (!quiz) return;
    setDeleting(true);
    try {
      await questionService.deleteByQuizId(quiz.id);
      await quizService.delete(quiz.id);
      success('Quiz deleted', 'The quiz has been deleted successfully.');
      router.push('/admin/quizzes');
    } catch (err: unknown) {
      error('Delete failed', (err as Error)?.message);
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  }

  if (loading || !quiz) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-xl)' }} />
        <div className="skeleton" style={{ height: 350, borderRadius: 'var(--radius-xl)' }} />
      </div>
    );
  }

  const totalMarks = questions.reduce((acc, q) => acc + (q.marks || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fade-in 300ms ease' }}>
      {/* Header Bar */}
      <div className="card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/admin/quizzes" className="btn btn-ghost btn-icon btn-sm">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {quiz.title}
              </h1>
              <span className={`badge ${statusColor(quiz.status)}`}>{statusLabel(quiz.status)}</span>
              <span className={`badge ${difficultyColor(quiz.difficulty)}`}>{difficultyLabel(quiz.difficulty)}</span>
            </div>
            {quiz.description && (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                {quiz.description}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={handleDuplicate}>
            <Copy size={14} /> Duplicate
          </button>
          <Link href={`/admin/quizzes/${quiz.id}/edit`} className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
            <Edit2 size={14} /> Edit Quiz
          </Link>
          <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirmOpen(true)}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Overview Stat Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Questions</span>
            <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>{questions.length}</span>
          </div>
        </div>

        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-secondary-light)', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Marks</span>
            <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalMarks}</span>
          </div>
        </div>

        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Duration</span>
            <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatDuration(quiz.duration)}</span>
          </div>
        </div>

        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-success-light)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Passing Score</span>
            <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>{quiz.passingPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Quiz Questions List */}
      <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Questions ({questions.length})
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
            Questions included in this quiz structure.
          </p>
        </div>

        {questions.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
            No questions attached to this quiz.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {questions.map((q, idx) => (
              <div
                key={q.id}
                style={{
                  padding: 20,
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                    QUESTION {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {q.marks || 1} mark{(q.marks || 1) !== 1 ? 's' : ''}
                  </span>
                </div>

                <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.45 }}>
                  {q.text}
                </p>

                {q.image && (
                  <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', maxHeight: 200, width: '100%', background: '#000000' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={q.image} alt="Question figure" style={{ width: '100%', maxHeight: 200, objectFit: 'contain' }} />
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  {q.options.map((opt, optIdx) => {
                    const letter = String.fromCharCode(65 + optIdx);
                    const isCorrect = Array.isArray(q.correctAnswer)
                      ? q.correctAnswer.includes(opt.id)
                      : q.correctAnswer === opt.id;

                    return (
                      <div
                        key={opt.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: isCorrect ? '1.5px solid var(--color-success)' : '1px solid var(--border-subtle)',
                          background: isCorrect ? 'var(--color-success-light)' : 'var(--color-soft-slate)',
                        }}
                      >
                        <span style={{ width: 22, height: 22, borderRadius: '50%', background: isCorrect ? 'var(--color-success)' : 'var(--border)', color: isCorrect ? '#fff' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                          {letter}
                        </span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', flex: 1, fontWeight: isCorrect ? 600 : 400 }}>
                          {opt.text}
                        </span>
                        {isCorrect && <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div style={{ marginTop: 6, padding: '8px 12px', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', color: 'var(--color-primary)' }}>
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Quiz?"
        message="This will permanently delete this quiz and its associated questions and data. This action cannot be undone."
        confirmLabel="Delete Permanently"
        cancelLabel="Cancel"
        isLoading={deleting}
      />
    </div>
  );
}
