'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, MinusCircle, Clock, RotateCcw, Home, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { attemptService } from '@/services/attemptService';
import { quizService } from '@/services/quizService';
import { questionService } from '@/services/questionService';
import { Attempt, Quiz, Question } from '@/types';
import ProgressRing from '@/components/quiz/ProgressRing';
import { formatTimeTaken } from '@/utils/formatters';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface Props { params: Promise<{ id: string; attemptId: string }> }

export default function ResultPage({ params }: Props) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, isInitialized } = useAuth();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    if (isInitialized && !authLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
      }
    }
  }, [isInitialized, authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isInitialized || authLoading || !isAuthenticated || !user) return;

    params.then(async ({ id, attemptId }) => {
      const [att, q] = await Promise.all([
        attemptService.getById(attemptId),
        quizService.getById(id),
      ]);
      if (!att || !q) { router.replace('/user/results'); return; }

      // Role check: participants can only view their own attempts
      if (user.role === 'user' && att.userId !== user.id) {
        router.replace('/user/results');
        return;
      }

      const qs = await questionService.getByQuizId(id);
      setAttempt(att);
      setQuiz(q);
      setQuestions(qs);
      setLoading(false);
    });
  }, [params, router, isInitialized, authLoading, isAuthenticated, user]);

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
        <div className="animate-spin" style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--color-primary)' }} />
      </div>
    );
  }

  if (!attempt || !quiz) return null;

  const pct = attempt.percentage;
  const passed = pct >= quiz.passingPercentage;

  const correct = questions.filter((q) => {
    const ans = attempt.answers.find((a) => a.questionId === q.id);
    if (!ans || ans.selectedAnswer === null) return false;
    if (q.type === 'multiple') {
      const c = Array.isArray(q.correctAnswer) ? [...q.correctAnswer].sort() : [q.correctAnswer];
      const s = Array.isArray(ans.selectedAnswer) ? [...ans.selectedAnswer].sort() : [ans.selectedAnswer];
      return JSON.stringify(c) === JSON.stringify(s);
    }
    return ans.selectedAnswer === q.correctAnswer;
  }).length;

  const incorrect = questions.filter((q) => {
    const ans = attempt.answers.find((a) => a.questionId === q.id);
    if (!ans || ans.selectedAnswer === null) return false;
    if (q.type === 'multiple') {
      const c = Array.isArray(q.correctAnswer) ? [...q.correctAnswer].sort() : [q.correctAnswer];
      const s = Array.isArray(ans.selectedAnswer) ? [...ans.selectedAnswer].sort() : [ans.selectedAnswer];
      return JSON.stringify(c) !== JSON.stringify(s);
    }
    return ans.selectedAnswer !== q.correctAnswer;
  }).length;

  const unanswered = questions.length - correct - incorrect;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-app)', padding: 'clamp(14px, 3vw, 40px)' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, animation: 'fade-in 400ms ease' }}>

        {/* Hero Score Card */}
        <div
          className="card"
          style={{
            padding: 'clamp(24px, 4vw, 44px)',
            textAlign: 'center',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--color-primary-subtle)',
            boxShadow: 'var(--shadow-md)',
            borderRadius: 'var(--radius-2xl)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: -30, right: -30, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, position: 'relative', zIndex: 2 }}>
            <ProgressRing
              value={pct}
              size={150}
              strokeWidth={12}
              color={passed ? 'var(--color-success)' : 'var(--color-error)'}
              label={`${Math.round(pct)}%`}
              sublabel={passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
            />
          </div>

          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            {passed ? 'Great Performance! 🎉' : 'Assessment Completed'}
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', margin: '0 0 24px' }}>
            {quiz.title}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 6 }}>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2.5rem',
                fontWeight: 900,
                color: passed ? 'var(--color-success)' : 'var(--color-error)',
                letterSpacing: '-0.03em',
              }}
            >
              {attempt.score}
            </span>
            <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              / {attempt.maxScore} pts
            </span>
          </div>

          {attempt.status === 'auto_submitted' && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-error)', marginTop: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <AlertCircle size={15} /> Auto-submitted due to proctoring security limits
            </p>
          )}
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 130px), 1fr))', gap: 14 }}>
          {[
            { icon: <CheckCircle2 size={20} />, label: 'Correct', value: correct, color: 'var(--color-success)' },
            { icon: <XCircle size={20} />, label: 'Incorrect', value: incorrect, color: 'var(--color-error)' },
            { icon: <MinusCircle size={20} />, label: 'Unanswered', value: unanswered, color: 'var(--text-muted)' },
            { icon: <Clock size={20} />, label: 'Time Taken', value: attempt.timeTaken ? formatTimeTaken(attempt.timeTaken) : '—', color: 'var(--color-primary)' },
          ].map(({ icon, label, value, color }) => (
            <div key={label} className="card" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ color, display: 'flex', justifyContent: 'center', marginBottom: 8 }}>{icon}</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Question Breakdown Accordion */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <button
            onClick={() => setShowBreakdown((v) => !v)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              background: 'var(--bg-slate)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9375rem',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              color: 'var(--text-primary)',
            }}
            aria-expanded={showBreakdown}
          >
            Question-by-Question Detailed Breakdown
            {showBreakdown ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {showBreakdown && (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {questions.map((q, i) => {
                const ans = attempt.answers.find((a) => a.questionId === q.id);
                const notAnswered = !ans || ans.selectedAnswer === null;
                let isCorrect = false;
                if (!notAnswered) {
                  if (q.type === 'multiple') {
                    const c = Array.isArray(q.correctAnswer) ? [...q.correctAnswer].sort() : [q.correctAnswer];
                    const s = Array.isArray(ans!.selectedAnswer) ? [...(ans!.selectedAnswer as string[])].sort() : [ans!.selectedAnswer as string];
                    isCorrect = JSON.stringify(c) === JSON.stringify(s);
                  } else {
                    isCorrect = ans!.selectedAnswer === q.correctAnswer;
                  }
                }

                return (
                  <div
                    key={q.id}
                    style={{
                      padding: 16,
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border)',
                      background: notAnswered ? 'var(--bg-app)' : isCorrect ? 'var(--color-success-light)' : 'var(--color-error-light)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span style={{ flexShrink: 0, marginTop: 2 }}>
                        {notAnswered ? <MinusCircle size={18} style={{ color: 'var(--text-muted)' }} /> : isCorrect ? <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} /> : <XCircle size={18} style={{ color: 'var(--color-error)' }} />}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                          Q{i + 1}. {q.text}
                        </p>
                        {q.explanation && !isCorrect && !notAnswered && (
                          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '6px 0 0', lineHeight: 1.5 }}>
                            <strong>Explanation:</strong> {q.explanation}
                          </p>
                        )}
                      </div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: isCorrect ? 'var(--color-success)' : notAnswered ? 'var(--text-muted)' : 'var(--color-error)', flexShrink: 0 }}>
                        {isCorrect ? `+${q.marks}` : notAnswered ? '—' : '0'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Link href="/user/dashboard" className="btn btn-secondary btn-lg" style={{ flex: '1 1 200px', textDecoration: 'none' }}>
            <Home size={16} /> Return to Dashboard
          </Link>
          <Link href="/user/quizzes" className="btn btn-primary btn-lg" style={{ flex: '1 1 200px', textDecoration: 'none' }}>
            <RotateCcw size={16} /> Explore More Quizzes
          </Link>
        </div>
      </div>
    </div>
  );
}
