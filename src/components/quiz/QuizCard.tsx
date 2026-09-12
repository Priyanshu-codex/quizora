'use client';

import Link from 'next/link';
import { Clock, BookOpen, ChevronRight, CheckCircle2, Play, Lock } from 'lucide-react';
import { Quiz, AttemptStatus } from '@/types';
import { difficultyColor, difficultyLabel, formatDuration, statusColor, statusLabel } from '@/utils/formatters';

interface QuizCardProps {
  quiz: Quiz;
  attemptStatus?: AttemptStatus;
  score?: number;
  maxScore?: number;
  actionHref: string;
  showStatus?: boolean;
}

export default function QuizCard({ quiz, attemptStatus, score, maxScore, actionHref, showStatus = false }: QuizCardProps) {
  const isCompleted = attemptStatus === 'completed' || attemptStatus === 'auto_submitted';
  const isInProgress = attemptStatus === 'in_progress';
  const isClosed = quiz.status === 'closed';
  const isDraft = quiz.status === 'draft';

  const percentage = isCompleted && score !== undefined && maxScore && maxScore > 0 
    ? Math.round((score / maxScore) * 100) 
    : 0;

  return (
    <div
      className="quiz-card"
      style={{
        opacity: isDraft || isClosed ? 0.78 : 1,
      }}
    >
      <div>
        {/* Header Tags */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
          <span className={`badge ${difficultyColor(quiz.difficulty)}`}>
            {difficultyLabel(quiz.difficulty)}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {showStatus && (
              <span className={`badge ${statusColor(quiz.status)}`}>
                {statusLabel(quiz.status)}
              </span>
            )}
            {isCompleted && !showStatus && (
              <span className="badge badge-success">
                <CheckCircle2 size={11} /> Completed
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.0625rem',
            fontWeight: 800,
            margin: '0 0 8px',
            color: 'var(--text-primary)',
            lineHeight: 1.3,
            letterSpacing: '-0.015em',
          }}
        >
          {quiz.title}
        </h3>

        {/* Description */}
        {quiz.description && (
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              margin: '0 0 14px',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {quiz.description}
          </p>
        )}
      </div>

      {/* Footer Info & Action */}
      <div>
        {/* Meta Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 14, borderBottom: '1px solid var(--border-subtle)', marginBottom: 14, flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
            }}
          >
            <BookOpen size={13} style={{ color: 'var(--color-primary)' }} />
            {quiz.questionCount} Questions
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
            }}
          >
            <Clock size={13} style={{ color: 'var(--color-primary)' }} />
            {formatDuration(quiz.duration)}
          </span>
        </div>

        {/* Score indicator if completed */}
        {isCompleted && score !== undefined && maxScore !== undefined && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              background: 'var(--bg-slate)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 14,
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Score Achieved</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-success)' }}>
              {score}/{maxScore} ({percentage}%)
            </span>
          </div>
        )}

        {/* CTA */}
        <div>
          {isClosed ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
                padding: '10px 0',
                background: 'var(--bg-slate)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
              }}
            >
              <Lock size={14} />
              Quiz closed
            </div>
          ) : (
            <Link
              href={actionHref}
              className={`btn btn-md ${isInProgress ? 'btn-gold' : isCompleted ? 'btn-secondary' : 'btn-primary'}`}
              style={{ width: '100%', textDecoration: 'none' }}
            >
              {isCompleted ? (
                <>View Results</>
              ) : isInProgress ? (
                <>
                  <Play size={14} />
                  Continue Quiz
                </>
              ) : (
                <>
                  <Play size={14} />
                  Start Quiz
                </>
              )}
              <ChevronRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
