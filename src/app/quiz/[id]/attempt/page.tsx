'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Flag, Send, Grid3X3, Lock, Maximize2, X, Play } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { quizService } from '@/services/quizService';
import { questionService } from '@/services/questionService';
import { attemptService } from '@/services/attemptService';
import { Quiz, Question, AttemptAnswer, ViolationRecord } from '@/types';
import Timer from '@/components/quiz/Timer';
import SecurityStatus from '@/components/quiz/SecurityStatus';
import QuestionPalette from '@/components/quiz/QuestionPalette';
import Modal from '@/components/ui/Modal';
import QuizoraLoader from '@/components/ui/QuizoraLoader';

interface Props { params: Promise<{ id: string }> }

export default function QuizAttemptPage({ params }: Props) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, isInitialized } = useAuth();

  const [quizId, setQuizId] = useState('');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AttemptAnswer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [attemptId, setAttemptId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isTestLocked, setIsTestLocked] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submitRef = useRef(false);
  const isResumingRef = useRef(false);

  const handleAutoSubmit = useCallback(async () => {
    if (submitRef.current) return;
    submitRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    setSubmitted(true);
    const active = attemptService.getActiveAttempt();
    if (active) {
      const result = await attemptService.submitAttempt(active.id, 'auto_submitted');
      router.replace(`/quiz/${quizId}/result/${result.id}`);
    }
  }, [quizId, router]);

  const recordViolation = useCallback(async (type: ViolationRecord['type'], description: string) => {
    if (submitRef.current) return;
    const rec: ViolationRecord = { type, timestamp: new Date().toISOString(), description };
    if (attemptId) {
      attemptService.recordViolation(attemptId, rec);
    }

    const active = attemptService.getActiveAttempt();
    const violationCount = active?.violations.length || 1;
    if (quiz && violationCount >= quiz.maxViolations) {
      setTimeout(() => handleAutoSubmit(), 1200);
    }
  }, [attemptId, quiz, handleAutoSubmit]);

  const resumeTest = async () => {
    isResumingRef.current = true;
    try {
      if (!document.fullscreenElement && quiz?.fullscreenRequired) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Proceed if browser restricts fullscreen
    }
    setIsTestLocked(false);
    window.focus();
    setTimeout(() => {
      isResumingRef.current = false;
    }, 400);
  };

  const startExam = async () => {
    isResumingRef.current = true;
    try {
      if (quiz?.fullscreenRequired && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Proceed if browser restricts fullscreen
    }
    setHasStarted(true);
    setIsTestLocked(false);
    setTimeout(() => {
      isResumingRef.current = false;
    }, 400);
  };

  // Auth Guard
  useEffect(() => {
    if (isInitialized && !authLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
        return;
      }
      if (user?.role === 'viewer') {
        router.replace('/viewer/quizzes');
        return;
      }
    }
  }, [isInitialized, authLoading, isAuthenticated, user, router]);

  // Init
  useEffect(() => {
    params.then(({ id }) => {
      setQuizId(id);
      Promise.all([
        quizService.getById(id),
        questionService.getByQuizId(id),
      ]).then(async ([q, qs]) => {
        if (!q) { router.replace('/user/quizzes'); return; }
        setQuiz(q);

        // Security: sanitize questions to omit correctAnswer and explanation in client state during test taking
        const sanitized = qs.map((question) => ({
          ...question,
          correctAnswer: '' as string,
          explanation: undefined,
        }));
        setQuestions(sanitized);
        setSecondsLeft(q.duration * 60);

        // If fullscreen is not required, mark as started automatically
        if (!q.fullscreenRequired || (typeof document !== 'undefined' && !!document.fullscreenElement)) {
          setHasStarted(true);
        }

        const active = attemptService.getActiveAttempt();
        if (active && active.quizId === id) {
          setAttemptId(active.id);
          setAnswers(active.answers);
          setHasStarted(true);
        } else if (user) {
          try {
            const newAttempt = await attemptService.startAttempt(user.id, id);
            setAttemptId(newAttempt.id);
          } catch {
            // Attempt may already exist
          }
        }
        setLoading(false);
      });
    });
  }, [params, user, router]);

  // Timer countdown - paused when test is locked or not yet started
  useEffect(() => {
    if (loading || submitted || secondsLeft <= 0 || isTestLocked || !hasStarted) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, submitted, secondsLeft, isTestLocked, hasStarted, handleAutoSubmit]);

  // Fullscreen, tab switch, and window blur detection (only active after exam starts)
  useEffect(() => {
    if (loading || submitted || !hasStarted) return;

    const onFSChange = () => {
      if (submitRef.current || isResumingRef.current) return;
      if (!document.fullscreenElement && quiz?.fullscreenRequired) {
        setIsTestLocked(true);
        recordViolation('fullscreen_exit', 'Exited fullscreen mode');
      }
    };

    const onVisChange = () => {
      if (submitRef.current || isResumingRef.current) return;
      if (document.hidden) {
        setIsTestLocked(true);
        recordViolation('tab_switch', 'Switched tab or window');
      }
    };

    const onBlur = () => {
      if (submitRef.current || isResumingRef.current) return;
      setIsTestLocked(true);
      recordViolation('window_blur', 'Window lost focus');
    };

    document.addEventListener('fullscreenchange', onFSChange);
    document.addEventListener('visibilitychange', onVisChange);
    window.addEventListener('blur', onBlur);

    return () => {
      document.removeEventListener('fullscreenchange', onFSChange);
      document.removeEventListener('visibilitychange', onVisChange);
      window.removeEventListener('blur', onBlur);
    };
  }, [loading, submitted, hasStarted, quiz?.fullscreenRequired, recordViolation]);

  // Prevent copy, paste, text selection, drag/drop, right-click, and inspection shortcuts
  useEffect(() => {
    if (loading || submitted) return;

    const preventDefault = (e: Event) => e.preventDefault();

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      // Prevent copy, paste, cut, select-all, print, save, view-source shortcuts
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a', 'p', 'u', 's'].includes(key)) {
        e.preventDefault();
      }
      // Prevent F12 and DevTools inspection shortcuts
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(key))
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('copy', preventDefault);
    document.addEventListener('cut', preventDefault);
    document.addEventListener('paste', preventDefault);
    document.addEventListener('selectstart', preventDefault);
    document.addEventListener('dragstart', preventDefault);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('cut', preventDefault);
      document.removeEventListener('paste', preventDefault);
      document.removeEventListener('selectstart', preventDefault);
      document.removeEventListener('dragstart', preventDefault);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [loading, submitted]);

  // Lock within test session (prevent back navigation and accidental tab close)
  useEffect(() => {
    if (submitted) return;
    window.history.pushState(null, '', window.location.href);

    const onPopState = () => {
      window.history.pushState(null, '', window.location.href);
    };

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!submitRef.current) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('popstate', onPopState);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [submitted]);

  const handleSelect = async (questionId: string, answer: string | string[]) => {
    setAnswers((prev) => {
      const idx = prev.findIndex((a) => a.questionId === questionId);
      const updated: AttemptAnswer = {
        questionId,
        selectedAnswer: answer,
        isMarkedForReview: idx !== -1 ? prev[idx].isMarkedForReview : false,
        timeSpent: 0,
      };
      const next = idx === -1 ? [...prev, updated] : prev.map((a, i) => i === idx ? updated : a);
      if (attemptId) attemptService.saveAnswer(attemptId, updated);
      return next;
    });
  };

  const toggleMark = () => {
    const q = questions[currentIndex];
    setAnswers((prev) => {
      const idx = prev.findIndex((a) => a.questionId === q.id);
      if (idx === -1) {
        const updated: AttemptAnswer = { questionId: q.id, selectedAnswer: null, isMarkedForReview: true, timeSpent: 0 };
        if (attemptId) attemptService.saveAnswer(attemptId, updated);
        return [...prev, updated];
      }
      const updated = { ...prev[idx], isMarkedForReview: !prev[idx].isMarkedForReview };
      if (attemptId) attemptService.saveAnswer(attemptId, updated);
      return prev.map((a, i) => i === idx ? updated : a);
    });
  };

  const handleSubmit = async () => {
    if (submitRef.current) return;
    submitRef.current = true;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    setSubmitted(true);
    const active = attemptService.getActiveAttempt();
    if (active) {
      const result = await attemptService.submitAttempt(active.id, 'completed');
      router.replace(`/quiz/${quizId}/result/${result.id}`);
    }
  };

  if (loading || !quiz) {
    return <QuizoraLoader message="Preparing your assessment…" subtitle="Loading test questions and security parameters" />;
  }

  // Pre-test proctoring entry screen if fullscreen is required and test hasn't started
  if (!hasStarted && quiz.fullscreenRequired) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(16px, 4vw, 32px)' }}>
        <div
          className="card"
          style={{
            maxWidth: 520,
            width: '100%',
            padding: 'clamp(28px, 5vw, 44px)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'var(--color-primary-light)',
              border: '2px solid var(--color-primary-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
            }}
          >
            <Maximize2 size={28} />
          </div>

          <div>
            <span className="badge badge-primary" style={{ marginBottom: 8, fontSize: '0.75rem', fontWeight: 700 }}>
              TEST LOCK ACTIVE
            </span>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 800, margin: '6px 0 8px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {quiz.title}
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              This proctored assessment requires fullscreen mode to maintain test integrity. Your timer will begin once you click start below.
            </p>
          </div>

          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: 14, background: 'var(--bg-slate)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Questions</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-primary)' }}>{questions.length}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Duration</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-primary)' }}>{quiz.duration}m</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Passing</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.125rem', color: 'var(--color-success)' }}>{quiz.passingPercentage}%</div>
            </div>
          </div>

          <button className="btn btn-primary btn-xl" style={{ width: '100%', justifyContent: 'center' }} onClick={startExam}>
            <Play size={18} /> Begin Assessment &amp; Enter Fullscreen
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers.find((a) => a.questionId === currentQuestion?.id);
  const selectedAnswer = currentAnswer?.selectedAnswer;
  const isMarked = currentAnswer?.isMarkedForReview ?? false;

  const answeredCount = answers.filter((a) => a.selectedAnswer !== null && (Array.isArray(a.selectedAnswer) ? a.selectedAnswer.length > 0 : true)).length;
  const unansweredCount = questions.length - answeredCount;

  const LETTER = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column', userSelect: 'none', WebkitUserSelect: 'none' }}>
      {/* ── TOP TESTING ENVIRONMENT HEADER ── */}
      <header
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          padding: '0 clamp(10px, 2.5vw, 24px)',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(8px, 2vw, 16px)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.015em' }}>
            {quiz.title}
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 12px)', flexShrink: 0 }}>
          {/* Progress bar */}
          <div style={{ width: 140, height: 6, background: 'var(--bg-slate)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }} className="mobile-hidden">
            <div style={{ height: '100%', width: `${((currentIndex + 1) / questions.length) * 100}%`, background: 'var(--color-primary)', borderRadius: 'var(--radius-full)', transition: 'width 0.3s ease' }} />
          </div>

          <Timer secondsLeft={secondsLeft} totalSeconds={quiz.duration * 60} />
          <SecurityStatus />

          <button
            className="btn btn-ghost btn-icon mobile-only"
            onClick={() => setPaletteOpen(true)}
            aria-label="Question navigator"
          >
            <Grid3X3 size={18} />
          </button>
        </div>
      </header>

      {/* ── TEST LOCK MODE PAUSED OVERLAY ── */}
      {isTestLocked && !submitted && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            animation: 'fade-in 200ms ease',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 480,
              width: '100%',
              padding: 'clamp(28px, 5vw, 40px)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-2xl)',
              background: 'var(--bg-surface)',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--color-primary-light)',
                border: '2px solid var(--color-primary-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)',
              }}
            >
              <Lock size={30} />
            </div>

            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.375rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: '0 0 10px',
                  letterSpacing: '-0.02em',
                }}
              >
                Test Session Paused
              </h2>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                <strong>Test Lock Mode is active.</strong> Your assessment was paused because the test window lost focus, you switched tabs, or fullscreen mode was exited.
              </p>
            </div>

            <div
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-slate)',
                border: '1px solid var(--border)',
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
              }}
            >
              To maintain exam integrity, you must remain in fullscreen and keep this test window active. Your assessment timer has been paused.
            </div>

            <button
              className="btn btn-primary btn-xl"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={resumeTest}
            >
              <Maximize2 size={18} /> Resume Test &amp; Enter Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN TESTING AREA ── */}
      <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden', maxWidth: 1240, margin: '0 auto', width: '100%', padding: '0 clamp(10px, 2vw, 20px)' }}>
        {/* Question Panel Area */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 'clamp(16px, 3vw, 32px) 0' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            
            {/* Question Header Card */}
            <div className="card" style={{ padding: 'clamp(16px, 3vw, 28px)', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--color-primary)',
                  }}
                >
                  QUESTION {String(currentIndex + 1).padStart(2, '0')} OF {String(questions.length).padStart(2, '0')}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                    {currentQuestion.marks} Mark{currentQuestion.marks !== 1 ? 's' : ''}
                  </span>
                  {isMarked && (
                    <span className="badge badge-warning">
                      <Flag size={10} /> Marked for review
                    </span>
                  )}
                </div>
              </div>

              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.0625rem, 2.5vw, 1.25rem)', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.45, letterSpacing: '-0.02em' }}>
                {currentQuestion.text}
              </h2>

              {currentQuestion.image && (
                <div style={{ marginTop: 18, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', maxWidth: 540, background: 'var(--bg-slate)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={currentQuestion.image} alt="Question illustration" style={{ width: '100%', maxHeight: 280, objectFit: 'contain' }} />
                </div>
              )}
            </div>

            {/* Answer Options Container */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {currentQuestion.type === 'truefalse'
                ? currentQuestion.options.map((opt) => {
                    const isSelected = selectedAnswer === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelect(currentQuestion.id, opt.id)}
                        className={`answer-option ${isSelected ? 'selected' : ''}`}
                      >
                        <div className={`answer-letter ${isSelected ? 'selected' : ''}`}>{opt.text[0]}</div>
                        <span style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', fontWeight: isSelected ? 700 : 500 }}>{opt.text}</span>
                      </button>
                    );
                  })
                : currentQuestion.options.map((opt, i) => {
                    const isSelected = currentQuestion.type === 'multiple'
                      ? Array.isArray(selectedAnswer) && selectedAnswer.includes(opt.id)
                      : selectedAnswer === opt.id;

                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          if (currentQuestion.type === 'multiple') {
                            const current = Array.isArray(selectedAnswer) ? selectedAnswer : [];
                            const next = current.includes(opt.id) ? current.filter((x) => x !== opt.id) : [...current, opt.id];
                            handleSelect(currentQuestion.id, next);
                          } else {
                            handleSelect(currentQuestion.id, opt.id);
                          }
                        }}
                        className={`answer-option ${isSelected ? 'selected' : ''}`}
                      >
                        <div className={`answer-letter ${isSelected ? 'selected' : ''}`}>{LETTER[i]}</div>
                        <span style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', fontWeight: isSelected ? 700 : 500, flex: 1 }}>{opt.text}</span>
                      </button>
                    );
                  })
              }
            </div>

            {/* Navigation Action Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary btn-md"
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft size={16} /> Previous
                </button>

                <button
                  className={`btn btn-md ${isMarked ? 'btn-gold' : 'btn-ghost'}`}
                  onClick={toggleMark}
                >
                  <Flag size={14} /> {isMarked ? 'Unmark Review' : 'Mark for Review'}
                </button>
              </div>

              <div>
                {currentIndex < questions.length - 1 ? (
                  <button
                    className="btn btn-primary btn-md"
                    onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                ) : (
                  <button className="btn btn-primary btn-md" onClick={() => setSubmitModalOpen(true)}>
                    <Send size={15} /> Submit Quiz
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Desktop Side Question Navigator */}
        <aside
          className="palette-desktop"
          style={{
            width: 240,
            flexShrink: 0,
            borderLeft: '1px solid var(--border)',
            padding: '32px 0 32px 24px',
            overflowY: 'auto',
          }}
        >
          <QuestionPalette questions={questions} answers={answers} currentIndex={currentIndex} onJump={setCurrentIndex} />
          <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-primary btn-md" style={{ width: '100%' }} onClick={() => setSubmitModalOpen(true)}>
              <Send size={15} /> Submit Quiz
            </button>
          </div>
        </aside>
      </div>

      {/* Mobile Navigator Drawer */}
      {paletteOpen && (
        <div className="modal-overlay" onClick={() => setPaletteOpen(false)}>
          <div
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg-surface)', borderRadius: '24px 24px 0 0', padding: 24, maxHeight: '75dvh', overflowY: 'auto', animation: 'scale-in 200ms ease' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.125rem' }}>Question Navigator</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setPaletteOpen(false)}><X size={18} /></button>
            </div>
            <QuestionPalette questions={questions} answers={answers} currentIndex={currentIndex} onJump={(i) => { setCurrentIndex(i); setPaletteOpen(false); }} />
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      <Modal isOpen={submitModalOpen} onClose={() => !submitting && setSubmitModalOpen(false)} title="Submit your quiz attempt?" showClose={!submitting}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Are you sure you want to submit? Once submitted, your answers will be locked and graded immediately.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16, background: 'var(--bg-slate)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            {[
              { label: 'Answered Questions', value: answeredCount, color: 'var(--color-success)' },
              { label: 'Unanswered Questions', value: unansweredCount, color: unansweredCount > 0 ? 'var(--color-error)' : 'var(--text-secondary)' },
              { label: 'Marked for Review', value: answers.filter((a) => a.isMarkedForReview).length, color: 'var(--color-accent)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-md" style={{ flex: '1 1 140px' }} onClick={() => setSubmitModalOpen(false)} disabled={submitting}>Continue Quiz</button>
            <button className="btn btn-primary btn-md" style={{ flex: '1 1 140px' }} onClick={handleSubmit} disabled={submitting}>
              {submitting ? <span className="animate-spin" style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', display: 'inline-block' }} /> : <><Send size={15} /> Submit Quiz</>}
            </button>
          </div>
        </div>
      </Modal>

      <style>{`
        * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }
        input, textarea {
          -webkit-user-select: auto !important;
          user-select: auto !important;
        }
        .mobile-hidden { display: flex; }
        .mobile-only   { display: none !important; }
        .palette-desktop { display: block; }
        @media (max-width: 900px) {
          .mobile-hidden   { display: none !important; }
          .mobile-only     { display: flex !important; }
          .palette-desktop { display: none !important; }
        }
      `}</style>
    </div>
  );
}
