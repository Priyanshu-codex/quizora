'use client';

import { useState, useEffect } from 'react';
import { BarChart3, BookOpen, Users, FileText, Eye } from 'lucide-react';
import { resultService } from '@/services/resultService';
import StatCard from '@/components/shared/StatCard';
import { useAuth } from '@/context/AuthContext';

interface ViewerSummaryData {
  totalQuizzes: number;
  published: number;
  totalParticipants: number;
  totalAttempts: number;
  avgScore: number;
}

export default function ViewerDashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ViewerSummaryData | null>(() => resultService.getCachedAdminSummary());
  const [loading, setLoading] = useState(() => !resultService.getCachedAdminSummary());

  useEffect(() => {
    let isMounted = true;
    resultService.getAdminSummary().then((s) => {
      if (isMounted) {
        setSummary(s);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, animation: 'fade-in 300ms ease' }}>
      
      {/* Read-Only Notice Banner */}
      <div
        style={{
          background: 'var(--bg-slate)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'clamp(14px, 2.5vw, 20px) clamp(16px, 3vw, 24px)',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--color-accent-gold-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-accent-gold-text)',
            flexShrink: 0,
            border: '1px solid var(--color-accent-gold-border)',
          }}
        >
          <Eye size={20} />
        </div>
        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 2 }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Good to see you, {user?.name || 'Viewer'}!
            </h3>
            <span className="badge badge-gold">READ ONLY ACCESS</span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
            You are viewing live platform metrics, quizzes, and participant performance in read-only mode. Creation and deletion controls are hidden.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 16 }}>
          {[1,2,3,4].map(i => <div key={i} className="card" style={{ height: 110, background: 'var(--bg-slate)' }} />)}
        </div>
      ) : summary ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 16 }}>
          <StatCard label="Total Quizzes" value={summary.totalQuizzes} icon={<BookOpen size={20} />} />
          <StatCard label="Published Quizzes" value={summary.published} icon={<BarChart3 size={20} />} color="var(--color-success)" />
          <StatCard label="Total Participants" value={summary.totalParticipants} icon={<Users size={20} />} color="var(--color-primary)" />
          <StatCard label="Total Attempts" value={summary.totalAttempts} icon={<FileText size={20} />} color="var(--color-accent)" />
        </div>
      ) : null}

    </div>
  );
}
