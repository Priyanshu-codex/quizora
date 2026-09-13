'use client';

import { memo } from 'react';
import { formatTime } from '@/utils/formatters';

interface TimerProps {
  secondsLeft: number;
  totalSeconds: number;
}

function Timer({ secondsLeft, totalSeconds }: TimerProps) {
  const pct = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const isWarning = pct <= 0.25 && pct > 0.1;
  const isDanger = pct <= 0.1;

  let cls = '';
  if (isDanger) cls = 'danger';
  else if (isWarning) cls = 'warning';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width="20" height="20" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
        <circle cx="10" cy="10" r="8" fill="none" stroke="var(--bg-slate)" strokeWidth="2" />
        <circle
          cx="10"
          cy="10"
          r="8"
          fill="none"
          stroke={isDanger ? 'var(--color-error)' : isWarning ? 'var(--color-accent)' : 'var(--color-primary)'}
          strokeWidth="2"
          strokeDasharray={`${2 * Math.PI * 8}`}
          strokeDashoffset={`${2 * Math.PI * 8 * (1 - pct)}`}
          strokeLinecap="round"
          transform="rotate(-90 10 10)"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
        />
      </svg>
      <span className={`timer-display ${cls}`}>{formatTime(secondsLeft)}</span>
    </div>
  );
}

export default memo(Timer);
