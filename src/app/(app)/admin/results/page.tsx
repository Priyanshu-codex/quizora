'use client';

import { useState, useEffect } from 'react';
import { participantService } from '@/services/participantService';
import { quizService } from '@/services/quizService';
import { Participant, Quiz } from '@/types';
import { formatDate, formatTimeTaken } from '@/utils/formatters';
import PageHeader from '@/components/shared/PageHeader';
import SearchBar from '@/components/shared/SearchBar';
import EmptyState from '@/components/ui/EmptyState';
import { FileText } from 'lucide-react';

export default function AdminResultsPage() {
  const [participants, setParticipants] = useState<Participant[]>(() =>
    participantService.getCachedAll().filter((x) => x.status === 'completed' || x.status === 'auto_submitted')
  );
  const [quizMap, setQuizMap] = useState<Record<string, Quiz>>(() => {
    const map: Record<string, Quiz> = {};
    quizService.getCachedAll().forEach((quiz) => { map[quiz.id] = quiz; });
    return map;
  });
  const [search, setSearch] = useState('');
  const [quizFilter, setQuizFilter] = useState('');
  const [loading, setLoading] = useState(() => participantService.getCachedAll().length === 0);

  useEffect(() => {
    let isMounted = true;
    Promise.all([participantService.getAll(), quizService.getAll()]).then(([p, q]) => {
      if (isMounted) {
        setParticipants(p.filter((x) => x.status === 'completed' || x.status === 'auto_submitted'));
        const map: Record<string, Quiz> = {};
        q.forEach((quiz) => { map[quiz.id] = quiz; });
        setQuizMap(map);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const quizzes = Object.values(quizMap);
  const filtered = participants.filter((p) => {
    if (search && !p.userName.toLowerCase().includes(search.toLowerCase()) && !p.userEmail.toLowerCase().includes(search.toLowerCase())) return false;
    if (quizFilter && p.quizId !== quizFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fade-in 300ms ease' }}>
      <PageHeader title="Results" description="All completed quiz attempts" />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by participant…" style={{ flex: '1 1 200px', minWidth: 140 }} />
        <select className="select-base" value={quizFilter} onChange={(e) => setQuizFilter(e.target.value)} style={{ flex: '1 1 180px' }} aria-label="Filter by quiz">
          <option value="">All quizzes</option>
          {quizzes.map((q) => <option key={q.id} value={q.id}>{q.title}</option>)}
        </select>
        {(search || quizFilter) && <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setQuizFilter(''); }}>Clear</button>}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState icon={<FileText size={24} />} title="No results found" description="Completed attempts will appear here." /></div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Quiz</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Result</th>
                  <th>Time Taken</th>
                  <th>Violations</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.userName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.userEmail}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{quizMap[p.quizId]?.title ?? '—'}</td>
                    <td style={{ fontWeight: 700 }}>{p.score} / {p.maxScore}</td>
                    <td><span style={{ fontWeight: 700, color: p.passed ? 'var(--color-success)' : 'var(--color-error)' }}>{p.percentage?.toFixed(1)}%</span></td>
                    <td><span className={`badge ${p.passed ? 'badge-success' : 'badge-error'}`}>{p.passed ? 'Passed' : 'Failed'}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.timeTaken ? formatTimeTaken(p.timeTaken) : '—'}</td>
                    <td>{(p.violations ?? 0) > 0 ? <span className="badge badge-warning">{p.violations}</span> : <span style={{ color: 'var(--text-muted)' }}>0</span>}</td>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.submittedAt ? formatDate(p.submittedAt) : '—'}</td>
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
