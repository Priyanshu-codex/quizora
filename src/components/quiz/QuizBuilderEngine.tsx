'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Save,
  Globe,
  Eye,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Upload,
  Image as ImageIcon,
  HelpCircle,
  CheckSquare,
  CircleDot,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { quizService } from '@/services/quizService';
import { questionService } from '@/services/questionService';
import { Quiz, Question, QuestionType, QuizStatus, QuizDifficulty } from '@/types';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Link from 'next/link';

// Helper function to create unique IDs outside component render cycle
function createUniqueId(prefix: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${prefix}-${timestamp}-${randomSuffix}`;
}

interface QuizBuilderEngineProps {
  initialQuiz?: Quiz;
  initialQuestions?: Question[];
  isEditing?: boolean;
}

export default function QuizBuilderEngine({
  initialQuiz,
  initialQuestions = [],
  isEditing = false,
}: QuizBuilderEngineProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error, info } = useToast();

  // ── Quiz Basic Settings State ──
  const [quizId] = useState<string>(() => initialQuiz?.id || createUniqueId('quiz'));
  const [title, setTitle] = useState(initialQuiz?.title || '');
  const [description, setDescription] = useState(initialQuiz?.description || '');
  const [duration, setDuration] = useState(initialQuiz?.duration || 30);
  const [passingPercentage, setPassingPercentage] = useState(initialQuiz?.passingPercentage || 60);
  const [maxAttempts, setMaxAttempts] = useState(initialQuiz?.maxAttempts || 3);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>(initialQuiz?.difficulty || 'medium');
  const [maxViolations, setMaxViolations] = useState(initialQuiz?.maxViolations || 3);
  const [fullscreenRequired, setFullscreenRequired] = useState(initialQuiz?.fullscreenRequired ?? true);
  const [status, setStatus] = useState<QuizStatus>(initialQuiz?.status || 'draft');

  // ── Questions State ──
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  
  // Track which question cards are expanded (IDs)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    return new Set(initialQuestions.map(q => q.id));
  });

  // ── UI Control States ──
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewActiveQ, setPreviewActiveQ] = useState(0);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [deleteQId, setDeleteQId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Calculate total marks across all questions
  const totalMarks = questions.reduce((acc, q) => acc + (q.marks || 0), 0);

  // Toggle card expansion
  function toggleExpand(qId: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  }

  function expandAll() {
    setExpandedIds(new Set(questions.map(q => q.id)));
  }

  function collapseAll() {
    setExpandedIds(new Set());
  }

  // ── Question Operations ──
  function handleAddQuestion() {
    const qId = createUniqueId('q');
    const optA = createUniqueId('opt');
    const optB = createUniqueId('opt');
    const optC = createUniqueId('opt');
    const optD = createUniqueId('opt');

    const newQ: Question = {
      id: qId,
      quizId,
      text: '',
      type: 'single',
      options: [
        { id: optA, text: 'Option A' },
        { id: optB, text: 'Option B' },
        { id: optC, text: 'Option C' },
        { id: optD, text: 'Option D' },
      ],
      correctAnswer: optA,
      marks: 1,
      explanation: '',
      order: questions.length + 1,
    };

    setQuestions((prev) => [...prev, newQ]);
    setExpandedIds((prev) => new Set(prev).add(qId));
    info('Question added', `Question ${questions.length + 1} added to quiz.`);
  }

  function handleUpdateQuestion(updated: Question) {
    setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
    if (validationErrors[`q_${updated.id}`]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[`q_${updated.id}`];
        return next;
      });
    }
  }

  function handleDuplicateQuestion(qId: string) {
    const target = questions.find((q) => q.id === qId);
    if (!target) return;

    const newId = createUniqueId('q');
    const clonedOptions = target.options.map((opt) => ({
      id: createUniqueId('opt'),
      text: opt.text,
    }));

    let clonedCorrect: string | string[] = target.correctAnswer;
    if (typeof target.correctAnswer === 'string') {
      const idx = target.options.findIndex((o) => o.id === target.correctAnswer);
      if (idx !== -1 && clonedOptions[idx]) clonedCorrect = clonedOptions[idx].id;
    } else if (Array.isArray(target.correctAnswer)) {
      clonedCorrect = target.correctAnswer
        .map((oldId) => {
          const idx = target.options.findIndex((o) => o.id === oldId);
          return idx !== -1 ? clonedOptions[idx]?.id : null;
        })
        .filter((id): id is string => id !== null);
    }

    const copy: Question = {
      ...target,
      id: newId,
      text: `${target.text} (Copy)`,
      options: clonedOptions,
      correctAnswer: clonedCorrect,
      order: questions.length + 1,
    };

    setQuestions((prev) => [...prev, copy]);
    setExpandedIds((prev) => new Set(prev).add(newId));
    info('Question duplicated', 'A copy of the question has been added.');
  }

  function handleDeleteQuestionConfirm() {
    if (!deleteQId) return;
    const remaining = questions.filter((q) => q.id !== deleteQId);
    const reordered = remaining.map((q, idx) => ({ ...q, order: idx + 1 }));
    setQuestions(reordered);

    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(deleteQId);
      return next;
    });

    setDeleteQId(null);
    info('Question deleted');
  }

  function handleMoveQuestion(index: number, direction: 'up' | 'down') {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === questions.length - 1)) {
      return;
    }
    const newQuestions = [...questions];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[targetIdx];
    newQuestions[targetIdx] = temp;

    const updated = newQuestions.map((q, idx) => ({ ...q, order: idx + 1 }));
    setQuestions(updated);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, q: Question) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error('Invalid file', 'Please select an image file (.png, .jpg, .webp).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      handleUpdateQuestion({ ...q, image: dataUrl });
      success('Image attached', 'Question image preview updated.');
    };
    reader.readAsDataURL(file);
  }

  // ── Add/Remove Option Helpers ──
  function handleAddOption(q: Question) {
    const newOptId = createUniqueId('opt');
    const letter = String.fromCharCode(65 + q.options.length);
    const updatedOptions = [...q.options, { id: newOptId, text: `Option ${letter}` }];
    handleUpdateQuestion({ ...q, options: updatedOptions });
  }

  function handleRemoveOption(q: Question, optId: string) {
    if (q.options.length <= 2) {
      error('Cannot remove option', 'Questions must have at least 2 options.');
      return;
    }
    const updatedOptions = q.options.filter(o => o.id !== optId);
    let updatedCorrect = q.correctAnswer;
    if (typeof q.correctAnswer === 'string' && q.correctAnswer === optId) {
      updatedCorrect = updatedOptions[0]?.id || '';
    } else if (Array.isArray(q.correctAnswer)) {
      updatedCorrect = q.correctAnswer.filter(id => id !== optId);
    }
    handleUpdateQuestion({ ...q, options: updatedOptions, correctAnswer: updatedCorrect });
  }

  function validateQuiz(): boolean {
    const errs: Record<string, string> = {};

    if (!title.trim()) {
      errs.title = 'Quiz title is required.';
    }

    if (!duration || duration <= 0) {
      errs.duration = 'Valid quiz duration is required.';
    }

    if (questions.length === 0) {
      errs.questions = 'Please add at least 1 question to your quiz.';
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        errs[`q_${q.id}`] = `Question ${i + 1}: Write question text.`;
        setExpandedIds((prev) => new Set(prev).add(q.id));
        break;
      }
      if (q.options.length < 2) {
        errs[`q_${q.id}`] = `Question ${i + 1}: At least 2 options required.`;
        setExpandedIds((prev) => new Set(prev).add(q.id));
        break;
      }
      if (
        !q.correctAnswer ||
        (Array.isArray(q.correctAnswer) && q.correctAnswer.length === 0) ||
        (typeof q.correctAnswer === 'string' && !q.correctAnswer.trim())
      ) {
        errs[`q_${q.id}`] = `Question ${i + 1}: Select at least one correct answer.`;
        setExpandedIds((prev) => new Set(prev).add(q.id));
        break;
      }
      if (!q.marks || q.marks < 1) {
        errs[`q_${q.id}`] = `Question ${i + 1}: Marks must be at least 1.`;
        setExpandedIds((prev) => new Set(prev).add(q.id));
        break;
      }
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSaveDraft() {
    if (!title.trim()) {
      error('Title required', 'Please enter a quiz title before saving.');
      setValidationErrors(prev => ({ ...prev, title: 'Quiz title is required.' }));
      return;
    }

    setIsSaving(true);
    try {
      const quizData: Quiz = {
        id: quizId,
        title: title.trim(),
        description: description.trim(),
        difficulty,
        duration: Number(duration),
        questionCount: questions.length,
        maxScore: totalMarks,
        passingPercentage: Number(passingPercentage),
        maxAttempts: Number(maxAttempts),
        status: 'draft',
        maxViolations: Number(maxViolations),
        fullscreenRequired,
        createdBy: initialQuiz?.createdBy || user?.id,
        createdAt: initialQuiz?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attemptCount: initialQuiz?.attemptCount || 0,
      };

      if (isEditing) {
        await quizService.update(quizId, quizData);
      } else {
        await quizService.create(quizData);
      }

      await questionService.replaceForQuiz(quizId, questions);
      setStatus('draft');
      success('Quiz saved as draft', `"${title}" has been saved.`);
    } catch (err: unknown) {
      error('Save failed', (err as Error)?.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublishConfirm() {
    setIsSaving(true);
    setPublishConfirmOpen(false);
    try {
      const quizData: Quiz = {
        id: quizId,
        title: title.trim(),
        description: description.trim(),
        difficulty,
        duration: Number(duration),
        questionCount: questions.length,
        maxScore: totalMarks,
        passingPercentage: Number(passingPercentage),
        maxAttempts: Number(maxAttempts),
        status: 'published',
        maxViolations: Number(maxViolations),
        fullscreenRequired,
        createdBy: initialQuiz?.createdBy || user?.id,
        createdAt: initialQuiz?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attemptCount: initialQuiz?.attemptCount || 0,
      };

      if (isEditing) {
        await quizService.update(quizId, quizData);
      } else {
        await quizService.create(quizData);
      }

      await questionService.replaceForQuiz(quizId, questions);
      setStatus('published');
      success('Quiz published successfully!', `Participants can now attempt "${title}".`);
      router.push('/admin/quizzes');
    } catch (err: unknown) {
      error('Publish failed', (err as Error)?.message);
    } finally {
      setIsSaving(false);
    }
  }

  function handlePublishClick() {
    if (!validateQuiz()) {
      const firstErrKey = Object.keys(validationErrors)[0];
      const errMsg = validationErrors[firstErrKey] || 'Please complete all required quiz fields.';
      error('Validation failed', errMsg);
      return;
    }
    setPublishConfirmOpen(true);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minHeight: 'calc(100vh - 100px)', animation: 'fade-in 300ms ease' }}>
      
      {/* ── TOP UNIFIED HEADER BAR ── */}
      <div
        className="card"
        style={{
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/admin/quizzes" className="btn btn-ghost btn-icon btn-sm" aria-label="Back to quizzes">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {title.trim() ? title : isEditing ? 'Edit Quiz' : 'Create Quiz'}
              </h1>
              <span className={`badge ${status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                {status.toUpperCase()}
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Create quiz details and add questions directly inside this builder.
            </p>
          </div>
        </div>

        {/* Counter Tags & Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="badge badge-neutral" style={{ fontSize: '0.75rem', padding: '4px 10px', textTransform: 'none' }}>
              Questions: <strong>{questions.length}</strong>
            </span>
            <span className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '4px 10px', textTransform: 'none' }}>
              Total Marks: <strong>{totalMarks}</strong>
            </span>
          </div>

          <div className="mobile-hidden" style={{ height: 24, width: 1, background: 'var(--border)' }} />

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleSaveDraft}
            disabled={isSaving}
          >
            <Save size={14} /> Save Draft
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              if (questions.length === 0) {
                error('Cannot Preview', 'Add at least 1 question to preview the quiz.');
                return;
              }
              setPreviewOpen(true);
            }}
          >
            <Eye size={14} /> Preview
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={handlePublishClick}
            disabled={isSaving}
          >
            <Globe size={14} /> Publish
          </button>
        </div>
      </div>

      {/* ── SECTION 1: QUIZ INFORMATION ── */}
      <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={18} style={{ color: 'var(--color-primary)' }} />
              Quiz Information
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Basic details, timing, scoring rules, and proctoring settings.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          {/* Quiz Title */}
          <div className="form-group">
            <label className="input-label" style={{ fontWeight: 700 }}>
              Quiz Title *
            </label>
            <input
              type="text"
              className={`input-base ${validationErrors.title ? 'input-error' : ''}`}
              placeholder="e.g., Modern Web Development & React Architecture"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (validationErrors.title) {
                  setValidationErrors(prev => { const n = { ...prev }; delete n.title; return n; });
                }
              }}
            />
            {validationErrors.title && <span className="input-error-msg">{validationErrors.title}</span>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="input-label" style={{ fontWeight: 700 }}>
              Description
            </label>
            <textarea
              className="textarea-base"
              rows={2}
              placeholder="Describe the scope, objectives, or instructions for this quiz..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Grid Settings Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 16 }}>
            <div className="form-group">
              <label className="input-label" style={{ fontWeight: 700 }}>
                Duration (minutes) *
              </label>
              <input
                type="number"
                min={1}
                max={300}
                className={`input-base ${validationErrors.duration ? 'input-error' : ''}`}
                value={duration}
                onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
              />
            </div>

            <div className="form-group">
              <label className="input-label" style={{ fontWeight: 700 }}>
                Passing Percentage (%)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                className="input-base"
                value={passingPercentage}
                onChange={(e) => setPassingPercentage(Math.min(100, Math.max(1, Number(e.target.value))))}
              />
            </div>

            <div className="form-group">
              <label className="input-label" style={{ fontWeight: 700 }}>
                Maximum Attempts
              </label>
              <input
                type="number"
                min={1}
                max={10}
                className="input-base"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Math.max(1, Number(e.target.value)))}
              />
            </div>

            <div className="form-group">
              <label className="input-label" style={{ fontWeight: 700 }}>
                Difficulty Level
              </label>
              <select
                className="select-base"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as QuizDifficulty)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Security & Anti-Cheat */}
          <div style={{ background: 'var(--color-soft-slate)', padding: 14, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldCheck size={20} style={{ color: 'var(--color-primary)' }} />
              <div>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                  Proctoring &amp; Anti-Cheat Security
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Enforce strict browser focus and limit tab switches.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Max Violations:</span>
                <input
                  type="number"
                  min={1}
                  max={5}
                  className="input-base"
                  style={{ width: 64, height: 32, padding: '0 8px', textAlign: 'center' }}
                  value={maxViolations}
                  onChange={(e) => setMaxViolations(Math.max(1, Number(e.target.value)))}
                />
              </div>

              <label className="login-checkbox-label" style={{ margin: 0 }}>
                <input
                  type="checkbox"
                  checked={fullscreenRequired}
                  onChange={(e) => setFullscreenRequired(e.target.checked)}
                  className="login-native-checkbox"
                />
                <span className="login-checkbox-custom">
                  {fullscreenRequired && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 3.5L3.8 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                <span className="login-checkbox-text" style={{ fontWeight: 600 }}>Require Fullscreen</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: QUESTIONS (UNIFIED DIRECT EDITING) ── */}
      <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Section Header */}
        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <HelpCircle size={20} style={{ color: 'var(--color-primary)' }} />
              Questions
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Create and organize the questions for this quiz.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {questions.length > 1 && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-xs" onClick={expandAll}>Expand All</button>
                <button className="btn btn-ghost btn-xs" onClick={collapseAll}>Collapse All</button>
              </div>
            )}

            <button
              className="btn btn-primary btn-md"
              style={{ fontWeight: 600 }}
              onClick={handleAddQuestion}
            >
              <Plus size={16} /> Add Question
            </button>
          </div>
        </div>

        {/* Validation Alert Banner */}
        {validationErrors.questions && (
          <div className="login-alert-banner" role="alert">
            <AlertCircle size={16} className="login-alert-icon" />
            <span>{validationErrors.questions}</span>
          </div>
        )}

        {/* Empty State */}
        {questions.length === 0 ? (
          <div className="empty-state card" style={{ padding: '48px 24px', background: 'var(--color-soft-slate)', border: '1.5px dashed var(--border)' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <HelpCircle size={24} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>
              No questions added yet.
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 16px', maxWidth: 360 }}>
              Add your first question to start building this quiz.
            </p>
            <button className="btn btn-primary btn-md" onClick={handleAddQuestion}>
              <Plus size={16} /> Add Question
            </button>
          </div>
        ) : (
          /* Question Cards List */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {questions.map((q, idx) => {
              const isExpanded = expandedIds.has(q.id);
              const hasError = !!validationErrors[`q_${q.id}`];

              return (
                <div
                  key={q.id}
                  id={`question-card-${q.id}`}
                  style={{
                    borderRadius: 'var(--radius-xl)',
                    border: hasError ? '2px solid var(--color-error)' : isExpanded ? '1.5px solid var(--color-primary)' : '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    boxShadow: isExpanded ? 'var(--shadow-md)' : 'var(--shadow-xs)',
                    transition: 'all var(--transition-base)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Collapsible Card Header Bar */}
                  <div
                    onClick={() => toggleExpand(q.id)}
                    style={{
                      padding: '14px 18px',
                      background: isExpanded ? 'var(--color-primary-light)' : 'var(--color-soft-slate)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      userSelect: 'none',
                      borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                      {/* Numbering Pill */}
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: isExpanded ? 'var(--color-primary)' : 'var(--border)',
                          color: isExpanded ? '#ffffff' : 'var(--text-primary)',
                          flexShrink: 0,
                          letterSpacing: '0.04em',
                        }}
                      >
                        QUESTION {String(idx + 1).padStart(2, '0')}
                      </span>

                      {/* Question Text Snippet */}
                      <span
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: isExpanded ? 'var(--color-primary)' : 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}
                      >
                        {q.text.trim() ? q.text : 'Untitled Question'}
                      </span>

                      {/* Type & Marks Badges */}
                      <div className="mobile-hidden" style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                          {q.type === 'single' ? 'Single Choice' : q.type === 'multiple' ? 'Multiple Choice' : 'True/False'}
                        </span>
                        <span className="badge badge-primary" style={{ fontSize: '0.6875rem' }}>
                          {q.marks || 1} mark{(q.marks || 1) !== 1 ? 's' : ''}
                        </span>
                        {q.image && (
                          <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>
                            <ImageIcon size={11} /> Image
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Question Actions & Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                      {/* Move Up / Move Down */}
                      <button
                        className="btn btn-ghost btn-xs"
                        disabled={idx === 0}
                        onClick={() => handleMoveQuestion(idx, 'up')}
                        title="Move Up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        className="btn btn-ghost btn-xs"
                        disabled={idx === questions.length - 1}
                        onClick={() => handleMoveQuestion(idx, 'down')}
                        title="Move Down"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => handleDuplicateQuestion(q.id)}
                        title="Duplicate Question"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        className="btn btn-ghost btn-xs"
                        style={{ color: 'var(--color-error)' }}
                        onClick={() => setDeleteQId(q.id)}
                        title="Delete Question"
                      >
                        <Trash2 size={13} />
                      </button>
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => toggleExpand(q.id)}
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Question Form Editor */}
                  {isExpanded && (
                    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
                      {validationErrors[`q_${q.id}`] && (
                        <div className="login-alert-banner" role="alert">
                          <AlertCircle size={15} className="login-alert-icon" />
                          <span>{validationErrors[`q_${q.id}`]}</span>
                        </div>
                      )}

                      {/* Question Text */}
                      <div className="form-group">
                        <label className="input-label" style={{ fontWeight: 700 }}>
                          Question Text *
                        </label>
                        <textarea
                          className="textarea-base"
                          value={q.text}
                          onChange={(e) => handleUpdateQuestion({ ...q, text: e.target.value })}
                          placeholder="Write your question text here..."
                          rows={3}
                          style={{ fontSize: '0.9375rem', fontWeight: 500 }}
                        />
                      </div>

                      {/* Question Image Attachment */}
                      <div className="form-group">
                        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ImageIcon size={15} /> Question Image (Optional)
                        </label>

                        {q.image ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
                            <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', maxHeight: 200, width: '100%', background: '#000000' }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={q.image}
                                alt="Question attachment"
                                style={{ width: '100%', maxHeight: 200, objectFit: 'contain' }}
                              />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                                <Upload size={14} /> Replace Image
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(e, q)}
                                  style={{ display: 'none' }}
                                />
                              </label>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--color-error)' }}
                                onClick={() => handleUpdateQuestion({ ...q, image: undefined })}
                              >
                                Remove Image
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 10,
                              padding: '14px 20px',
                              border: '1.5px dashed var(--border)',
                              borderRadius: 'var(--radius-lg)',
                              background: 'var(--color-soft-slate)',
                              cursor: 'pointer',
                              transition: 'all var(--transition-fast)',
                            }}
                          >
                            <Upload size={18} style={{ color: 'var(--color-primary)' }} />
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              Attach Image
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              (PNG, JPG, WebP)
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, q)}
                              style={{ display: 'none' }}
                            />
                          </label>
                        )}
                      </div>

                      {/* Question Type & Marks Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 16 }}>
                        <div className="form-group">
                          <label className="input-label" style={{ fontWeight: 700 }}>
                            Question Type
                          </label>
                          <select
                            className="select-base"
                            value={q.type}
                            onChange={(e) => {
                              const newType = e.target.value as QuestionType;
                              let newOptions = q.options;
                              let newCorrect = q.correctAnswer;

                              if (newType === 'truefalse') {
                                const optT = createUniqueId('opt');
                                const optF = createUniqueId('opt');
                                newOptions = [
                                  { id: optT, text: 'True' },
                                  { id: optF, text: 'False' },
                                ];
                                newCorrect = optT;
                              } else if (newType === 'single') {
                                newCorrect = Array.isArray(newCorrect) ? newCorrect[0] || newOptions[0]?.id : newCorrect;
                              } else if (newType === 'multiple') {
                                newCorrect = typeof newCorrect === 'string' ? [newCorrect] : newCorrect;
                              }

                              handleUpdateQuestion({
                                ...q,
                                type: newType,
                                options: newOptions,
                                correctAnswer: newCorrect,
                              });
                            }}
                          >
                            <option value="single">Single Choice (Radio)</option>
                            <option value="multiple">Multiple Choice (Checkboxes)</option>
                            <option value="truefalse">True / False</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="input-label" style={{ fontWeight: 700 }}>
                            Marks / Points
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            className="input-base"
                            value={q.marks}
                            onChange={(e) => handleUpdateQuestion({ ...q, marks: Math.max(1, Number(e.target.value)) })}
                          />
                        </div>
                      </div>

                      {/* Options & Correct Answer Selection */}
                      <div className="form-group" style={{ gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label className="input-label" style={{ fontWeight: 700, margin: 0 }}>
                            Options &amp; Correct Answer Selection *
                          </label>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {q.type === 'single'
                              ? 'Click radio to set the ONE correct answer'
                              : q.type === 'multiple'
                              ? 'Click checkboxes to set ALL correct answers'
                              : 'Select True or False'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {q.options.map((opt, optIdx) => {
                            const optionLetter = String.fromCharCode(65 + optIdx);
                            const isCorrect = Array.isArray(q.correctAnswer)
                              ? q.correctAnswer.includes(opt.id)
                              : q.correctAnswer === opt.id;

                            return (
                              <div
                                key={opt.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 10,
                                  padding: '8px 12px',
                                  border: isCorrect ? '1.5px solid var(--color-success)' : '1px solid var(--border)',
                                  borderRadius: 'var(--radius-lg)',
                                  background: isCorrect ? 'var(--color-success-light)' : 'var(--bg-surface)',
                                  transition: 'all var(--transition-fast)',
                                }}
                              >
                                {/* Correct Selector Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (q.type === 'multiple') {
                                      const curr = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
                                      const next = curr.includes(opt.id) ? curr.filter((id) => id !== opt.id) : [...curr, opt.id];
                                      handleUpdateQuestion({ ...q, correctAnswer: next });
                                    } else {
                                      handleUpdateQuestion({ ...q, correctAnswer: opt.id });
                                    }
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                  }}
                                  title="Mark as correct answer"
                                >
                                  {q.type === 'multiple' ? (
                                    <CheckSquare
                                      size={18}
                                      style={{ color: isCorrect ? 'var(--color-success)' : 'var(--text-muted)' }}
                                    />
                                  ) : (
                                    <CircleDot
                                      size={18}
                                      style={{ color: isCorrect ? 'var(--color-success)' : 'var(--text-muted)' }}
                                    />
                                  )}
                                  <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: isCorrect ? 'var(--color-success)' : 'var(--text-secondary)', minWidth: 16 }}>
                                    {optionLetter}
                                  </span>
                                </button>

                                {/* Option Text */}
                                <input
                                  type="text"
                                  className="input-base"
                                  style={{ height: 38, flex: 1, background: '#ffffff' }}
                                  value={opt.text}
                                  readOnly={q.type === 'truefalse'}
                                  onChange={(e) => {
                                    const updatedOpts = q.options.map((o) => (o.id === opt.id ? { ...o, text: e.target.value } : o));
                                    handleUpdateQuestion({ ...q, options: updatedOpts });
                                  }}
                                  placeholder={`Option ${optionLetter} text...`}
                                />

                                {/* Remove Option Button */}
                                {q.type !== 'truefalse' && q.options.length > 2 && (
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-icon btn-sm"
                                    style={{ color: 'var(--text-muted)' }}
                                    onClick={() => handleRemoveOption(q, opt.id)}
                                    title="Remove option"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Add Option Button */}
                        {q.type !== 'truefalse' && q.options.length < 8 && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ alignSelf: 'flex-start', marginTop: 4 }}
                            onClick={() => handleAddOption(q)}
                          >
                            <Plus size={14} /> Add Option
                          </button>
                        )}
                      </div>

                      {/* Explanation */}
                      <div className="form-group">
                        <label className="input-label" style={{ fontWeight: 600 }}>
                          Explanation (Optional)
                        </label>
                        <textarea
                          className="textarea-base"
                          rows={2}
                          placeholder="Provide an explanation to show candidates after submission..."
                          value={q.explanation || ''}
                          onChange={(e) => handleUpdateQuestion({ ...q, explanation: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Bottom Add Question Button */}
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
              <button
                className="btn btn-primary btn-md"
                style={{ fontWeight: 600, padding: '0 24px' }}
                onClick={handleAddQuestion}
              >
                <Plus size={16} /> Add Question
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── PUBLISH CONFIRMATION MODAL ── */}
      <Modal
        isOpen={publishConfirmOpen}
        onClose={() => setPublishConfirmOpen(false)}
        title="Publish Quiz?"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 0' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
            Once published, participants will be able to attempt this quiz.
          </p>

          <div
            style={{
              padding: 16,
              background: 'var(--color-primary-light)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Quiz Title</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary)' }}>{title}</span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Questions</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary)' }}>{questions.length} questions</span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Marks</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary)' }}>{totalMarks} marks</span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Duration</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary)' }}>{duration} minutes</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button className="btn btn-secondary btn-md" onClick={() => setPublishConfirmOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary btn-md" onClick={handlePublishConfirm} disabled={isSaving}>
              {isSaving ? 'Publishing…' : 'Publish Quiz'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── PREVIEW MODAL ── */}
      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Quiz Preview — ${title || 'Untitled Quiz'}`}
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Preview Header Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--color-soft-slate)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 12, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <span>Questions: <strong>{questions.length}</strong></span>
              <span>Total Marks: <strong>{totalMarks}</strong></span>
              <span>Duration: <strong>{duration} min</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-primary)', fontSize: '0.8125rem', fontWeight: 700 }}>
              <Clock size={14} /> Preview Mode
            </div>
          </div>

          {/* Question Index Pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setPreviewActiveQ(idx)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-sm)',
                  border: previewActiveQ === idx ? '2px solid var(--color-primary)' : '1px solid var(--border)',
                  background: previewActiveQ === idx ? 'var(--color-primary)' : 'var(--bg-surface)',
                  color: previewActiveQ === idx ? '#fff' : 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {/* Active Question Preview */}
          {questions[previewActiveQ] && (
            <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  QUESTION {previewActiveQ + 1} OF {questions.length}
                </span>
                <span className="badge badge-primary">{questions[previewActiveQ].marks} Mark(s)</span>
              </div>

              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {questions[previewActiveQ].text || 'Untitled Question'}
              </p>

              {questions[previewActiveQ].image && (
                <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', maxHeight: 200, width: '100%', background: '#000000' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={questions[previewActiveQ].image}
                    alt="Question visual"
                    style={{ width: '100%', maxHeight: 200, objectFit: 'contain' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {questions[previewActiveQ].options.map((opt, oIdx) => {
                  const letter = String.fromCharCode(65 + oIdx);
                  const isCorrect = Array.isArray(questions[previewActiveQ].correctAnswer)
                    ? questions[previewActiveQ].correctAnswer.includes(opt.id)
                    : questions[previewActiveQ].correctAnswer === opt.id;

                  return (
                    <div
                      key={opt.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: isCorrect ? '1.5px solid var(--color-success)' : '1px solid var(--border)',
                        background: isCorrect ? 'var(--color-success-light)' : 'var(--bg-surface)',
                      }}
                    >
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: isCorrect ? 'var(--color-success)' : 'var(--border)', color: isCorrect ? '#fff' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                        {letter}
                      </span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', flex: 1 }}>{opt.text}</span>
                      {isCorrect && <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={previewActiveQ === 0}
              onClick={() => setPreviewActiveQ(prev => prev - 1)}
            >
              Previous Question
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={previewActiveQ === questions.length - 1}
              onClick={() => setPreviewActiveQ(prev => prev + 1)}
            >
              Next Question
            </button>
          </div>
        </div>
      </Modal>

      {/* ── DELETE CONFIRMATION DIALOG ── */}
      <ConfirmDialog
        isOpen={!!deleteQId}
        onClose={() => setDeleteQId(null)}
        onConfirm={handleDeleteQuestionConfirm}
        title="Delete Question?"
        message="Are you sure you want to delete this question? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
