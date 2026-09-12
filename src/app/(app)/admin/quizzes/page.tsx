'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, MoreVertical, Eye, Edit2, Copy, Trash2, Globe, EyeOff, Lock, Unlock, BookOpen } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { quizService } from '@/services/quizService';
import { questionService } from '@/services/questionService';
import { Quiz } from '@/types';
import { formatDate, difficultyColor, difficultyLabel, statusColor, statusLabel } from '@/utils/formatters';
import PageHeader from '@/components/shared/PageHeader';
import SearchBar from '@/components/shared/SearchBar';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';

interface ActionMenuProps {
  quiz: Quiz;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onTogglePublish: (quiz: Quiz) => void;
  onToggleClose: (quiz: Quiz) => void;
}

function ActionMenu({ quiz, onDelete, onDuplicate, onTogglePublish, onToggleClose }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpen(v => !v)} aria-label="Actions">
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="dropdown-menu" style={{ right: 0, top: '100%', marginTop: 4 }}>
          <Link href={`/admin/quizzes/${quiz.id}`} className="dropdown-item" onClick={() => setOpen(false)}>
            <Eye size={14} /> Preview / View
          </Link>
          <Link href={`/admin/quizzes/${quiz.id}/edit`} className="dropdown-item" onClick={() => setOpen(false)}>
            <Edit2 size={14} /> Edit Quiz
          </Link>
          <button className="dropdown-item" onClick={() => { onDuplicate(quiz.id); setOpen(false); }}>
            <Copy size={14} /> Duplicate Quiz
          </button>
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
          <button className="dropdown-item" onClick={() => { onTogglePublish(quiz); setOpen(false); }}>
            {quiz.status === 'published' ? <><EyeOff size={14} /> Unpublish</> : <><Globe size={14} /> Publish Quiz</>}
          </button>
          <button className="dropdown-item" onClick={() => { onToggleClose(quiz); setOpen(false); }}>
            {quiz.status === 'closed' ? <><Unlock size={14} /> Reopen Quiz</> : <><Lock size={14} /> Close Quiz</>}
          </button>
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
          <button className="dropdown-item danger" onClick={() => { onDelete(quiz.id); setOpen(false); }}>
            <Trash2 size={14} /> Delete Quiz
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminQuizzesPage() {
  const { success, error } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft' | 'closed'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    quizService.getAll().then((q) => { setQuizzes(q); setLoading(false); });
  }, []);

  const filtered = quizzes.filter((q) => {
    if (search && !q.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTab !== 'all' && q.status !== activeTab) return false;
    return true;
  });

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await questionService.deleteByQuizId(deleteId);
      await quizService.delete(deleteId);
      setQuizzes((prev) => prev.filter((q) => q.id !== deleteId));
      success('Quiz deleted', 'The quiz has been permanently deleted.');
    } catch (err: unknown) {
      error('Delete failed', (err as Error)?.message);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  async function handleDuplicate(id: string) {
    try {
      const copy = await quizService.duplicate(id);
      setQuizzes((prev) => [copy, ...prev]);
      success('Quiz duplicated', 'A copy has been created as a draft.');
    } catch (err: unknown) {
      error('Duplicate failed', (err as Error)?.message);
    }
  }

  async function handleTogglePublish(quiz: Quiz) {
    try {
      const updated = quiz.status === 'published' ? await quizService.unpublish(quiz.id) : await quizService.publish(quiz.id);
      setQuizzes((prev) => prev.map((q) => q.id === updated.id ? updated : q));
      success(quiz.status === 'published' ? 'Quiz unpublished' : 'Quiz published');
    } catch (err: unknown) {
      error('Action failed', (err as Error)?.message);
    }
  }

  async function handleToggleClose(quiz: Quiz) {
    try {
      const updated = quiz.status === 'closed' ? await quizService.unpublish(quiz.id) : await quizService.close(quiz.id);
      setQuizzes((prev) => prev.map((q) => q.id === updated.id ? updated : q));
      success(quiz.status === 'closed' ? 'Quiz reopened' : 'Quiz closed');
    } catch (err: unknown) {
      error('Action failed', (err as Error)?.message);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fade-in 300ms ease' }}>
      <PageHeader
        title="Quiz Management"
        description="Search, create, publish, and manage all assessment quizzes on the platform."
        actions={
          <Link href="/admin/quizzes/new" className="btn btn-primary btn-md" style={{ textDecoration: 'none' }}>
            <Plus size={16} /> Create Quiz
          </Link>
        }
      />

      {/* Status Segmented Tabs + Search Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          {/* Segmented Tabs */}
          <div className="segmented-control">
            {(['all', 'published', 'draft', 'closed'] as const).map((tab) => (
              <button
                key={tab}
                className={`segment-btn ${activeTab === tab ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab)}
                style={{ padding: '0 14px', textTransform: 'capitalize' }}
              >
                {tab} {tab === 'all' ? `(${quizzes.length})` : `(${quizzes.filter(q => q.status === tab).length})`}
              </button>
            ))}
          </div>

          <SearchBar value={search} onChange={setSearch} placeholder="Search quizzes by title…" style={{ flex: '1 1 220px', maxWidth: '100%' }} />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="card" style={{ height: 64, background: 'var(--bg-slate)' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={28} />}
          title={search || activeTab !== 'all' ? 'No quizzes match your search' : 'No quizzes created yet'}
          description={search || activeTab !== 'all' ? 'Try adjusting your search query or tab selection.' : 'Create your first quiz to get started.'}
          action={
            activeTab !== 'all' || search ? (
              <button className="btn btn-secondary btn-md" onClick={() => { setSearch(''); setActiveTab('all'); }}>Reset filters</button>
            ) : (
              <Link href="/admin/quizzes/new" className="btn btn-primary btn-md" style={{ textDecoration: 'none' }}>
                <Plus size={16} /> Create Quiz
              </Link>
            )
          }
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Quiz Title</th>
                <th>Difficulty</th>
                <th>Questions</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Updated</th>
                <th style={{ width: 50, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((quiz) => (
                <tr key={quiz.id}>
                  <td>
                    <Link href={`/admin/quizzes/${quiz.id}`} style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}>
                      {quiz.title}
                    </Link>
                  </td>
                  <td><span className={`badge ${difficultyColor(quiz.difficulty)}`}>{difficultyLabel(quiz.difficulty)}</span></td>
                  <td style={{ fontWeight: 700 }}>{quiz.questionCount}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{quiz.duration} mins</td>
                  <td><span className={`badge ${statusColor(quiz.status)}`}>{statusLabel(quiz.status)}</span></td>
                  <td style={{ fontWeight: 700 }}>{quiz.attemptCount}</td>
                  <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(quiz.updatedAt || quiz.createdAt)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <ActionMenu
                      quiz={quiz}
                      onDelete={(id: string) => setDeleteId(id)}
                      onDuplicate={handleDuplicate}
                      onTogglePublish={handleTogglePublish}
                      onToggleClose={handleToggleClose}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Destructive Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete this quiz?"
        message="This will permanently delete the quiz, all its questions, and participant history. This action cannot be undone."
        confirmLabel="Delete Permanently"
        cancelLabel="Cancel"
        isLoading={deleting}
      />
    </div>
  );
}
