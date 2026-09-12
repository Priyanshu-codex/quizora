'use client';

import { useState, useEffect } from 'react';
import { quizService } from '@/services/quizService';
import { Quiz } from '@/types';
import { difficultyColor, difficultyLabel, formatDuration, statusColor, statusLabel } from '@/utils/formatters';
import PageHeader from '@/components/shared/PageHeader';
import SearchBar from '@/components/shared/SearchBar';
import EmptyState from '@/components/ui/EmptyState';
import { BookOpen } from 'lucide-react';

export default function ViewerQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    quizService.getAll().then((q) => { setQuizzes(q); setLoading(false); });
  }, []);

  const filtered = quizzes.filter((q) => {
    if (search && !q.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && q.status !== statusFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fade-in 300ms ease' }}>
      <PageHeader title="Quizzes" description="View all quizzes on the platform (read-only)" badge={<span className="badge badge-neutral">Read-only</span>} />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <SearchBar value={search} onChange={setSearch} style={{ flex: '1 1 200px', minWidth: 140 }} />
        <select className="select-base" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ flex: '1 1 150px' }} aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 70, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState icon={<BookOpen size={22} />} title="No quizzes found" /></div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>Quiz</th><th>Questions</th><th>Duration</th><th>Difficulty</th><th>Status</th><th>Attempts</th></tr>
              </thead>
              <tbody>
                {filtered.map((quiz) => (
                  <tr key={quiz.id}>
                    <td><div style={{ fontWeight: 600 }}>{quiz.title}</div></td>
                    <td style={{ fontWeight: 600 }}>{quiz.questionCount}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatDuration(quiz.duration)}</td>
                    <td><span className={`badge ${difficultyColor(quiz.difficulty)}`}>{difficultyLabel(quiz.difficulty)}</span></td>
                    <td><span className={`badge ${statusColor(quiz.status)}`}>{statusLabel(quiz.status)}</span></td>
                    <td style={{ fontWeight: 600 }}>{quiz.attemptCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
