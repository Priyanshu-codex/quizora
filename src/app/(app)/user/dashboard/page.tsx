'use client';

import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, Clock, TrendingUp, Play, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { quizService } from '@/services/quizService';
import { attemptService } from '@/services/attemptService';
import { Quiz, Attempt } from '@/types';
import { getGreeting } from '@/utils/formatters';
import StatCard from '@/components/shared/StatCard';
import QuizCard from '@/components/quiz/QuizCard';
import PageHeader from '@/components/shared/PageHeader';
import Link from 'next/link';

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      quizService.getPublished(),
      attemptService.getByUserId(user.id),
    ]).then(([q, a]) => {
      setQuizzes(q);
      setAttempts(a);
      setLoading(false);
    });
  }, [user]);

  if (!user) return null;

  const completed = attempts.filter((a) => a.status === 'completed' || a.status === 'auto_submitted');
  const inProgress = attempts.filter((a) => a.status === 'in_progress');
  const avgScore = completed.length > 0
    ? Math.round(completed.reduce((s, a) => s + a.percentage, 0) / completed.length)
    : 0;

  function getAttemptStatus(quizId: string): Attempt['status'] | undefined {
    const latestAttempt = attempts
      .filter((a) => a.quizId === quizId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];
    return latestAttempt?.status;
  }

  function getAttemptResult(quizId: string) {
    const latestAttempt = attempts
      .filter((a) => a.quizId === quizId && (a.status === 'completed' || a.status === 'auto_submitted'))
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];
    return latestAttempt;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="card" style={{ height: 120, background: 'var(--bg-slate)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="card" style={{ height: 110, background: 'var(--bg-slate)' }} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, animation: 'fade-in 300ms ease' }}>
      
      {/* Hero Banner */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-2xl)',
          padding: 'clamp(28px, 4vw, 36px)',
          color: 'var(--text-primary)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--color-primary-subtle)',
        }}
      >
        <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: '30%', width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(2, 132, 199, 0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 640 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '4px 10px', fontWeight: 700 }}>
              {getGreeting()}, {user.name.split(' ')[0]}!
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)', fontWeight: 800, margin: '4px 0 0', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Ready for your next challenge?
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            You have {quizzes.length} available assessment{quizzes.length !== 1 ? 's' : ''} to test and benchmark your knowledge.
          </p>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 16 }}>
        <StatCard
          label="Available Quizzes"
          value={quizzes.length}
          icon={<BookOpen size={20} />}
        />
        <StatCard
          label="Completed"
          value={completed.length}
          icon={<CheckCircle2 size={20} />}
          color="var(--color-success)"
        />
        <StatCard
          label="In Progress"
          value={inProgress.length}
          icon={<Clock size={20} />}
          color="var(--color-secondary)"
        />
        <StatCard
          label="Average Score"
          value={completed.length > 0 ? `${avgScore}%` : '—'}
          icon={<TrendingUp size={20} />}
          color="var(--color-primary)"
        />
      </div>

      {/* Active Attempt Banner ("Continue Quiz") */}
      {inProgress.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PageHeader title="Continue Active Attempt" description="Resume your in-progress quiz session" />
          {inProgress.map((attempt) => {
            const quiz = quizzes.find((q) => q.id === attempt.quizId);
            if (!quiz) return null;
            return (
              <div
                key={attempt.id}
                style={{
                  background: 'var(--bg-slate)',
                  border: '1.5px solid var(--color-primary)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <div>
                  <span className="badge badge-primary" style={{ marginBottom: 6 }}>IN PROGRESS ATTEMPT</span>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {quiz.title}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                    {quiz.questionCount} questions · Duration: {quiz.duration} mins
                  </p>
                </div>

                <Link
                  href={`/quiz/${quiz.id}/attempt`}
                  className="btn btn-primary btn-lg"
                  style={{ textDecoration: 'none' }}
                >
                  <Play size={16} /> Resume Quiz Now <ArrowRight size={16} />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Available Quizzes Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <PageHeader title="Explore Quizzes" description="Pick an assessment and begin your evaluation" />
        {quizzes.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center', background: 'var(--bg-slate)' }}>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>No quizzes available right now.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 20 }}>
            {quizzes.map((quiz) => {
              const status = getAttemptStatus(quiz.id);
              const result = getAttemptResult(quiz.id);
              return (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  attemptStatus={status}
                  score={result?.score}
                  maxScore={result?.maxScore}
                  actionHref={
                    status === 'completed' || status === 'auto_submitted'
                      ? `/quiz/${quiz.id}/result/${result?.id}`
                      : `/user/quizzes/${quiz.id}`
                  }
                />
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
