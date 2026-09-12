'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Users, TrendingUp, CheckCircle2, FileText, ArrowUpRight, Sparkles, Plus, Award } from 'lucide-react';
import { resultService, QuizAnalytics } from '@/services/resultService';
import { quizService } from '@/services/quizService';
import { Quiz } from '@/types';
import StatCard from '@/components/shared/StatCard';
import Link from 'next/link';

interface AdminSummaryData {
  totalQuizzes: number;
  published: number;
  totalParticipants: number;
  totalAttempts: number;
  completedAttempts: number;
  avgScore: number;
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<AdminSummaryData | null>(null);
  const [analytics, setAnalytics] = useState<QuizAnalytics[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      resultService.getAdminSummary(),
      resultService.getOverallAnalytics(),
      quizService.getAll(),
    ]).then(([s, a, q]) => {
      setSummary(s);
      setAnalytics(a.slice(0, 5));
      setRecentQuizzes(q.slice(0, 5));
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="card" style={{ height: 110, background: 'var(--bg-slate)' }} />)}
        </div>
        <div className="card" style={{ height: 320, background: 'var(--bg-slate)' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, animation: 'fade-in 300ms ease' }}>
      
      {/* Greeting Banner */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-2xl)',
          padding: '28px 32px',
          color: 'var(--text-primary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20,
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--color-primary-subtle)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: -30, right: 120, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-primary" style={{ fontSize: '0.6875rem' }}>
              <Sparkles size={12} /> ADMIN CONSOLE
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
            Welcome back, Administrator
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            Real-time assessment platform activity and participant metrics.
          </p>
        </div>

        <Link href="/admin/quizzes/new" className="btn btn-primary btn-lg" style={{ textDecoration: 'none', position: 'relative', zIndex: 1 }}>
          <Plus size={18} /> Create New Quiz
        </Link>
      </div>

      {/* KPI Stat Cards (6 metrics dynamically populated) */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          <StatCard label="Total Quizzes" value={summary.totalQuizzes} icon={<BookOpen size={20} />} />
          <StatCard label="Active Quizzes" value={summary.published} icon={<CheckCircle2 size={20} />} color="var(--color-success)" badge="LIVE" />
          <StatCard label="Total Participants" value={summary.totalParticipants} icon={<Users size={20} />} color="var(--color-primary)" />
          <StatCard label="Total Attempts" value={summary.totalAttempts} icon={<FileText size={20} />} color="var(--color-accent)" />
          <StatCard label="Completed Attempts" value={summary.completedAttempts} icon={<Award size={20} />} color="var(--color-success)" />
          <StatCard label="Average Score" value={summary.totalAttempts > 0 ? `${summary.avgScore}%` : '—'} icon={<TrendingUp size={20} />} color="var(--color-secondary)" />
        </div>
      )}

      {/* Dashboard Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="dashboard-grid">
        
        {/* Recent Quizzes Card */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-slate)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.0625rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.015em' }}>
              Recent Quizzes
            </h3>
            <Link href="/admin/quizzes" className="btn btn-ghost btn-sm" style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          <div>
            {recentQuizzes.map((quiz, i) => (
              <div key={quiz.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 24px', borderBottom: i < recentQuizzes.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9375rem', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                    {quiz.title}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    {quiz.questionCount} questions · {quiz.attemptCount} attempts · {quiz.duration} mins
                  </p>
                </div>
                <span className={`badge ${quiz.status === 'published' ? 'badge-success' : quiz.status === 'draft' ? 'badge-warning' : 'badge-neutral'}`}>
                  {quiz.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Analytics Overview */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-slate)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.0625rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.015em' }}>
              Performance Breakdown
            </h3>
            <Link href="/admin/analytics" className="btn btn-ghost btn-sm" style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
              Details <ArrowUpRight size={14} />
            </Link>
          </div>
          <div>
            {analytics.map((a, i) => (
              <div key={a.quizId} style={{ padding: '16px 24px', borderBottom: i < analytics.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%', color: 'var(--text-primary)' }}>
                    {a.quizTitle}
                  </span>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.875rem', fontWeight: 800, color: a.averagePercentage >= 70 ? 'var(--color-success)' : a.averagePercentage >= 50 ? 'var(--color-accent)' : 'var(--color-error)' }}>
                    {a.averagePercentage}% Avg
                  </span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-slate)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${a.passRate}%`, background: a.passRate >= 70 ? 'var(--color-success)' : a.passRate >= 50 ? 'var(--color-accent)' : 'var(--color-error)', borderRadius: 'var(--radius-full)', transition: 'width 0.8s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.attempted}/{a.totalParticipants} attempted</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{a.passRate}% Pass Rate</span>
                </div>
              </div>
            ))}
            {analytics.length === 0 && (
              <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No analytics recorded yet.</div>
            )}
          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 900px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
