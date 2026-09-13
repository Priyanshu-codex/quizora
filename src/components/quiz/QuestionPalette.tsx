'use client';

import { memo } from 'react';
import { AttemptAnswer, Question } from '@/types';

interface QuestionPaletteProps {
  questions: Question[];
  answers: AttemptAnswer[];
  currentIndex: number;
  onJump: (index: number) => void;
}

type QState = 'current' | 'answered' | 'unanswered' | 'review' | 'answered-review';

function getState(
  index: number,
  currentIndex: number,
  answer?: AttemptAnswer
): QState {
  if (index === currentIndex) return 'current';
  if (!answer) return 'unanswered';
  const hasAnswer = answer.selectedAnswer !== null && answer.selectedAnswer !== undefined &&
    (Array.isArray(answer.selectedAnswer) ? answer.selectedAnswer.length > 0 : true);
  if (answer.isMarkedForReview && hasAnswer) return 'answered-review';
  if (answer.isMarkedForReview) return 'review';
  if (hasAnswer) return 'answered';
  return 'unanswered';
}

function QuestionPalette({ questions, answers, currentIndex, onJump }: QuestionPaletteProps) {
  const legend = [
    { state: 'current' as QState, label: 'Current' },
    { state: 'answered' as QState, label: 'Answered' },
    { state: 'unanswered' as QState, label: 'Not answered' },
    { state: 'review' as QState, label: 'Marked for review' },
    { state: 'answered-review' as QState, label: 'Answered + review' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', margin: '0 0 12px' }}>
          Question Palette
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))', gap: 8 }}>
          {questions.map((q, i) => {
            const ans = answers.find((a) => a.questionId === q.id);
            const state = getState(i, currentIndex, ans);
            return (
              <button
                key={q.id}
                onClick={() => onJump(i)}
                className={`q-bubble ${state}`}
                aria-label={`Question ${i + 1}, ${state}`}
                aria-current={state === 'current' ? 'true' : undefined}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
        {legend.map(({ state, label }) => (
          <div key={state} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className={`q-bubble ${state}`} style={{ width: 18, height: 18, fontSize: '0.5625rem', cursor: 'default', flexShrink: 0 }}>
              {state === 'current' ? '●' : ''}
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(QuestionPalette);
