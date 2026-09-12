'use client';

// Viewer Participants — re-exports admin participants without write actions
// Since admin page is already read-only (no edit/delete actions shown), this page
// provides the same view under the viewer route
import { useState, useEffect } from 'react';
import { participantService } from '@/services/participantService';
import { quizService } from '@/services/quizService';
import { Participant, Quiz } from '@/types';
import { formatDate, statusColor, statusLabel } from '@/utils/formatters';
import PageHeader from '@/components/shared/PageHeader';
import SearchBar from '@/components/shared/SearchBar';
import EmptyState from '@/components/ui/EmptyState';
import { Users } from 'lucide-react';

export default function ViewerParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [quizMap, setQuizMap] = useState<Record<string, Quiz>>({});
  const [search, setSearch] = useState('');
  const [quizFilter, setQuizFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([participantService.getAll(), quizService.getAll()]).then(([p, q]) => {
      setParticipants(p);
      const map: Record<string, Quiz> = {};
      q.forEach((quiz) => { map[quiz.id] = quiz; });
      setQuizMap(map);
      setLoading(false);
    });
  }, []);

  const quizzes = Object.values(quizMap);
  const filtered = participants.filter((p) => {
    if (search && !p.userName.toLowerCase().includes(search.toLowerCase())) return false;
    if (quizFilter && p.quizId !== quizFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fade-in 300ms ease' }}>
      <PageHeader title="Participants" description="View quiz participation data (read-only)" badge={<span className="badge badge-neutral">Read-only</span>} />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <SearchBar value={search} onChange={setSearch} style={{ flex: '1 1 200px' }} />
        <select className="select-base" value={quizFilter} onChange={(e) => setQuizFilter(e.target.value)} style={{ flex: '0 1 200px' }} aria-label="Filter by quiz">
          <option value="">All quizzes</option>
          {quizzes.map((q) => <option key={q.id} value={q.id}>{q.title}</option>)}
        </select>
      </div>
      {loading ? (
        <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState icon={<Users size={22} />} title="No participant data" /></div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Participant</th><th>Quiz</th><th>Status</th><th>Score</th><th>Percentage</th><th>Submitted</th></tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td><div style={{ fontWeight: 600 }}>{p.userName}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.userEmail}</div></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{quizMap[p.quizId]?.title ?? '—'}</td>
                    <td><span className={`badge ${statusColor(p.status)}`}>{statusLabel(p.status)}</span></td>
                    <td style={{ fontWeight: 600 }}>{p.score !== undefined ? `${p.score} / ${p.maxScore}` : '—'}</td>
                    <td>{p.percentage !== undefined ? <span style={{ fontWeight: 700, color: p.passed ? 'var(--color-success)' : 'var(--color-error)' }}>{p.percentage.toFixed(1)}%</span> : '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.submittedAt ? formatDate(p.submittedAt) : '—'}</td>
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
