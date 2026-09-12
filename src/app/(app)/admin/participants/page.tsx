'use client';

import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { participantService } from '@/services/participantService';
import { quizService } from '@/services/quizService';
import { Participant, Quiz } from '@/types';
import { formatDate, formatTimeTaken, statusColor, statusLabel } from '@/utils/formatters';
import PageHeader from '@/components/shared/PageHeader';
import SearchBar from '@/components/shared/SearchBar';
import EmptyState from '@/components/ui/EmptyState';

export default function AdminParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [quizMap, setQuizMap] = useState<Record<string, Quiz>>({});
  const [search, setSearch] = useState('');
  const [quizFilter, setQuizFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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
    if (search && !p.userName.toLowerCase().includes(search.toLowerCase()) && !p.userEmail.toLowerCase().includes(search.toLowerCase())) return false;
    if (quizFilter && p.quizId !== quizFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    return true;
  });

  const hasFilters = !!(search || quizFilter || statusFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fade-in 300ms ease' }}>
      <PageHeader title="Participant Tracking" description="Monitor real-time participation status, scores, and proctoring violations." />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email…" style={{ flex: '1 1 240px' }} />
        <select className="select-base" value={quizFilter} onChange={(e) => setQuizFilter(e.target.value)} style={{ flex: '0 1 220px' }} aria-label="Filter by quiz">
          <option value="">All quizzes</option>
          {quizzes.map((q) => <option key={q.id} value={q.id}>{q.title}</option>)}
        </select>
        <select className="select-base" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ flex: '0 1 180px' }} aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="not_attempted">Not attempted</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="auto_submitted">Auto-submitted</option>
        </select>
        {hasFilters && <button className="btn btn-ghost btn-md" onClick={() => { setSearch(''); setQuizFilter(''); setStatusFilter(''); }}>Clear</button>}
      </div>

      {!loading && (
        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>
          Showing {filtered.length} participant record{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3,4].map(i => <div key={i} className="card" style={{ height: 60, background: 'var(--bg-slate)' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title={hasFilters ? 'No participants match your filters' : 'No participation data yet'}
          description={hasFilters ? 'Try adjusting your filters.' : 'Participants will appear here after attempting quizzes.'}
          action={hasFilters ? <button className="btn btn-secondary btn-md" onClick={() => { setSearch(''); setQuizFilter(''); setStatusFilter(''); }}>Clear filters</button> : undefined}
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Quiz</th>
                <th>Status</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Time Taken</th>
                <th>Violations</th>
                <th>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const quiz = quizMap[p.quizId];
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-primary)' }}>{p.userName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.userEmail}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{quiz?.title ?? '—'}</td>
                    <td><span className={`badge ${statusColor(p.status)}`}>{statusLabel(p.status)}</span></td>
                    <td style={{ fontWeight: 700 }}>{p.score !== undefined ? `${p.score} / ${p.maxScore}` : '—'}</td>
                    <td>
                      {p.percentage !== undefined ? (
                        <span style={{ fontWeight: 800, color: p.passed ? 'var(--color-success)' : 'var(--color-error)' }}>
                          {p.percentage.toFixed(1)}%
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.timeTaken ? formatTimeTaken(p.timeTaken) : '—'}</td>
                    <td>
                      {(p.violations ?? 0) > 0 ? (
                        <span className="badge badge-error">{p.violations} violations</span>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>0</span>}
                    </td>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.submittedAt ? formatDate(p.submittedAt) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
