'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { attemptService } from '@/services/attemptService';
import { quizService } from '@/services/quizService';
import { Attempt, Quiz } from '@/types';
import { formatDate, formatTimeTaken } from '@/utils/formatters';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function UserResultsPage() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [quizMap, setQuizMap] = useState<Record<string, Quiz>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    attemptService.getByUserId(user.id).then(async (atts) => {
      const completed = atts.filter((a) => a.status === 'completed' || a.status === 'auto_submitted');
      setAttempts(completed);
      const ids = [...new Set(completed.map((a) => a.quizId))];
      const quizzes = await Promise.all(ids.map((id) => quizService.getById(id)));
      const map: Record<string, Quiz> = {};
      quizzes.forEach((q) => { if (q) map[q.id] = q; });
      setQuizMap(map);
      setLoading(false);
    });
  }, [user]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fade-in 300ms ease' }}>
      <PageHeader title="My Results" description="All your completed quiz attempts" />

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : attempts.length === 0 ? (
        <div className="card">
          <EmptyState icon={<FileText size={24} />} title="No results yet" description="Complete a quiz to see your results here." />
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Quiz</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th>Time Taken</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => {
                  const quiz = quizMap[attempt.quizId];
                  const passed = attempt.percentage >= (quiz ? quiz.passingPercentage : 60);
                  return (
                    <tr key={attempt.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{quiz?.title ?? 'Unknown Quiz'}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {attempt.score} / {attempt.maxScore}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: passed ? 'var(--color-success)' : 'var(--color-error)' }}>
                          {attempt.percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${passed ? 'badge-success' : 'badge-error'}`}>
                          {passed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {attempt.timeTaken ? formatTimeTaken(attempt.timeTaken) : '—'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {attempt.submittedAt ? formatDate(attempt.submittedAt) : '—'}
                      </td>
                      <td>
                        <Link href={`/quiz/${attempt.quizId}/result/${attempt.id}`} className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
                          <ExternalLink size={13} /> View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
