'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Clock, Target, Shield, AlertCircle, ChevronRight, Play } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { quizService } from '@/services/quizService';
import { attemptService } from '@/services/attemptService';
import { Quiz } from '@/types';
import { difficultyColor, difficultyLabel, formatDuration } from '@/utils/formatters';
import Modal from '@/components/ui/Modal';

interface Props { params: Promise<{ id: string }> }

export default function QuizDetailPage({ params }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  useEffect(() => {
    params.then(({ id }) => {
      quizService.getById(id).then((q) => {
        setQuiz(q);
        setLoading(false);
      });
    });
  }, [params]);

  async function handleStart() {
    if (!user || !quiz) return;
    setStarting(true);
    try {
      await attemptService.startAttempt(user.id, quiz.id);
      setConfirmOpen(false);
      success('Quiz started!', 'Good luck!');
      router.push(`/quiz/${quiz.id}/attempt`);
    } catch (err: unknown) {
      error('Failed to start quiz', (err as Error)?.message);
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-xl)' }} />
        <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-xl)' }} />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="card" style={{ padding: 48, textAlign: 'center' }}>
        <AlertCircle size={32} style={{ color: 'var(--color-error)', margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Quiz not found.</p>
        <button className="btn btn-secondary btn-sm" onClick={() => router.back()} style={{ marginTop: 12 }}>Go back</button>
      </div>
    );
  }

  const infoItems = [
    { icon: <BookOpen size={16} />, label: 'Questions', value: `${quiz.questionCount} questions` },
    { icon: <Clock size={16} />, label: 'Duration', value: formatDuration(quiz.duration) },
    { icon: <Target size={16} />, label: 'Max Score', value: quiz.maxScore },
    { icon: <Target size={16} />, label: 'Passing', value: `${quiz.passingPercentage}%` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720, animation: 'fade-in 300ms ease' }}>
      {/* Hero */}
      <div className="card" style={{ padding: 'clamp(20px, 3vw, 32px)', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: 'linear-gradient(135deg, var(--color-primary-light), transparent)', borderRadius: '0 0 0 100%', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <span className={`badge ${difficultyColor(quiz.difficulty)}`}>{difficultyLabel(quiz.difficulty)}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 800, margin: '0 0 12px', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            {quiz.title}
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.65, maxWidth: 560 }}>
            {quiz.description}
          </p>
        </div>
      </div>

      {/* Quiz info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: 12 }}>
        {infoItems.map(({ icon, label, value }) => (
          <div key={label} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-primary)' }}>{icon}</div>
            <div>
              <p style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', margin: '0 0 2px' }}>{label}</p>
              <p style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 14px', color: 'var(--text-primary)' }}>Before you begin</h2>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            `This quiz contains ${quiz.questionCount} questions.`,
            `You have ${formatDuration(quiz.duration)} to complete it.`,
            `The passing score is ${quiz.passingPercentage}% of the total marks.`,
            quiz.fullscreenRequired ? 'Fullscreen mode is required. Do not exit fullscreen during the quiz.' : 'Fullscreen is not required for this quiz.',
            `You may attempt this quiz up to ${quiz.maxAttempts} time${quiz.maxAttempts !== 1 ? 's' : ''}.`,
            'Read each question carefully before selecting your answer.',
            'You can mark questions for review and return to them before submission.',
          ].map((item, i) => (
            <li key={i} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item}</li>
          ))}
        </ul>

        {quiz.fullscreenRequired && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '12px 14px',
              background: 'var(--color-warning-light)',
              border: '1px solid rgba(229, 161, 0, 0.4)',
              borderRadius: 'var(--radius-md)',
              marginTop: 16,
            }}
          >
            <Shield size={16} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: '0.8125rem', color: '#A06B00', margin: 0, lineHeight: 1.55 }}>
              <strong>Secure Quiz Mode:</strong> This quiz uses browser-level security measures. Leaving the quiz screen, switching tabs, or exiting fullscreen will be recorded as a security violation.
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-secondary btn-md" onClick={() => router.back()} style={{ flex: '1 1 120px' }}>Go back</button>
        <button className="btn btn-primary btn-lg" onClick={() => setConfirmOpen(true)} style={{ flex: '2 1 200px' }}>
          <Play size={16} />
          Start Quiz
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={confirmOpen} onClose={() => !starting && setConfirmOpen(false)} title="Ready to begin?" showClose={!starting}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            You are about to start <strong style={{ color: 'var(--text-primary)' }}>{quiz.title}</strong>.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 16px', background: 'var(--bg-slate)', borderRadius: 'var(--radius-md)' }}>
            {[
              { label: 'Questions', value: quiz.questionCount },
              { label: 'Duration', value: formatDuration(quiz.duration) },
              { label: 'Max score', value: quiz.maxScore },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>
          {quiz.fullscreenRequired && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: 'var(--color-warning-light)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(229, 161, 0, 0.4)' }}>
              <Shield size={14} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: '0.8125rem', color: '#A06B00', margin: 0 }}>
                Once started, leaving the quiz screen may be recorded as a security violation.
              </p>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-md" style={{ flex: '1 1 120px' }} onClick={() => setConfirmOpen(false)} disabled={starting}>Cancel</button>
            <button className="btn btn-primary btn-md" style={{ flex: '1 1 120px' }} onClick={handleStart} disabled={starting}>
              {starting ? <span className="animate-spin" style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block' }} /> : <><Play size={14} /> Start Quiz</>}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
