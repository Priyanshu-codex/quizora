'use client';

import { useState, useEffect } from 'react';
import { resultService } from '@/services/resultService';
import { QuizAnalytics } from '@/types';
import { formatTimeTaken } from '@/utils/formatters';
import PageHeader from '@/components/shared/PageHeader';
import ProgressRing from '@/components/quiz/ProgressRing';

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<QuizAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resultService.getOverallAnalytics().then((a) => {
      setAnalytics(a.filter((x) => x.attempted > 0));
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fade-in 300ms ease' }}>
      <PageHeader title="Analytics" description="Platform-wide quiz performance overview" />

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 290px), 1fr))', gap: 16 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : analytics.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
          No attempt data available yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 290px), 1fr))', gap: 16 }}>
          {analytics.map((a) => (
            <div key={a.quizId} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', lineHeight: 1.3 }}>{a.quizTitle}</h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <ProgressRing value={a.passRate} size={80} strokeWidth={8} label={`${a.passRate}%`} sublabel="pass rate" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div><span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{a.attempted}</span><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 4 }}>/ {a.totalParticipants} attempted</span></div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Avg. score: <strong>{a.averagePercentage}%</strong></div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Avg. time: <strong>{a.averageTimeTaken ? formatTimeTaken(a.averageTimeTaken) : '—'}</strong></div>
                </div>
              </div>

              {/* Participation bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  <span>Participation</span>
                  <span>{a.totalParticipants > 0 ? Math.round((a.attempted / a.totalParticipants) * 100) : 0}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-slate)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${a.totalParticipants > 0 ? (a.attempted / a.totalParticipants) * 100 : 0}%`, background: 'var(--color-primary)', borderRadius: 'var(--radius-full)', transition: 'width 0.8s ease' }} />
                </div>
              </div>

              {/* Score distribution */}
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Score Distribution</p>
                <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 48 }}>
                  {a.scoreDistribution.map((d, i) => {
                    const maxCount = Math.max(...a.scoreDistribution.map((x) => x.count), 1);
                    const h = (d.count / maxCount) * 100;
                    return (
                      <div key={d.range} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <div
                          title={`${d.range}: ${d.count} participant${d.count !== 1 ? 's' : ''}`}
                          style={{
                            width: '100%',
                            height: `${Math.max(h, 4)}%`,
                            minHeight: 4,
                            background: i < 2 ? 'var(--color-error)' : i === 2 ? 'var(--color-warning)' : 'var(--color-success)',
                            borderRadius: 3,
                            transition: 'height 0.5s ease',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between', marginTop: 4 }}>
                  {a.scoreDistribution.map((d) => (
                    <span key={d.range} style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', textAlign: 'center', flex: 1 }}>{d.count}</span>
                  ))}
                </div>
              </div>

              {/* Status breakdown */}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, textAlign: 'center', padding: '8px 4px', background: 'var(--bg-slate)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-success)' }}>{a.completed}</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Completed</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: '8px 4px', background: 'var(--bg-slate)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-warning)' }}>{a.inProgress}</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>In Progress</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: '8px 4px', background: 'var(--bg-slate)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)' }}>{a.notAttempted}</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Not attempted</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
