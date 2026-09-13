'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { quizService } from '@/services/quizService';
import { attemptService } from '@/services/attemptService';
import { Quiz, Attempt } from '@/types';
import QuizCard from '@/components/quiz/QuizCard';
import SearchBar from '@/components/shared/SearchBar';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { BookOpen } from 'lucide-react';

export default function UserQuizzesPage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>(() => quizService.getCachedPublished());
  const [attempts, setAttempts] = useState<Attempt[]>(() => (user ? attemptService.getCachedByUserId(user.id) : []));
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(() => quizService.getCachedPublished().length === 0);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    Promise.all([quizService.getPublished(), attemptService.getByUserId(user.id)]).then(([q, a]) => {
      if (isMounted) {
        setQuizzes(q);
        setAttempts(a);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [user]);

  function getAttemptStatus(quizId: string): Attempt['status'] | undefined {
    const a = attempts.filter((a) => a.quizId === quizId).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];
    return a?.status;
  }

  function getAttemptResult(quizId: string) {
    return attempts.filter((a) => a.quizId === quizId && (a.status === 'completed' || a.status === 'auto_submitted')).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];
  }

  const filtered = quizzes.filter((q) => {
    if (search && !q.title.toLowerCase().includes(search.toLowerCase()) && !q.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (difficulty && q.difficulty !== difficulty) return false;
    if (statusFilter) {
      const as = getAttemptStatus(q.id);
      if (statusFilter === 'completed' && as !== 'completed' && as !== 'auto_submitted') return false;
      if (statusFilter === 'not_attempted' && as) return false;
      if (statusFilter === 'in_progress' && as !== 'in_progress') return false;
    }
    return true;
  });

  const hasFilters = !!(search || difficulty || statusFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fade-in 300ms ease' }}>
      <PageHeader title="My Quizzes" description="Discover and attempt available quizzes" />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search quizzes…" style={{ flex: '1 1 180px', minWidth: 140 }} />
        <select className="select-base" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ flex: '1 1 140px' }} aria-label="Filter by difficulty">
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select className="select-base" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ flex: '1 1 140px' }} aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="not_attempted">Not attempted</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setDifficulty(''); setStatusFilter(''); }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Result count */}
      {!loading && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
          {filtered.length} quiz{filtered.length !== 1 ? 'zes' : ''} found
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton" style={{ height: 220, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<BookOpen size={24} />}
            title={hasFilters ? 'No quizzes match your filters' : 'No quizzes available'}
            description={hasFilters ? 'Try adjusting or clearing your filters.' : 'Check back later for new quizzes.'}
            action={hasFilters ? (
              <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setDifficulty(''); setStatusFilter(''); }}>
                Clear filters
              </button>
            ) : undefined}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
          {filtered.map((quiz) => {
            const status = getAttemptStatus(quiz.id);
            const result = getAttemptResult(quiz.id);
            return (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                attemptStatus={status}
                score={result?.score}
                maxScore={result?.maxScore}
                actionHref={status === 'completed' || status === 'auto_submitted' ? `/quiz/${quiz.id}/result/${result?.id}` : `/user/quizzes/${quiz.id}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
