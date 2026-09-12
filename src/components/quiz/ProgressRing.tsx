import React from 'react';

interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}

export default function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  color,
  label,
  sublabel,
}: ProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(value, 0), 100);
  const offset = circ - (pct / 100) * circ;

  const ringColor =
    color ??
    (pct >= 70 ? 'var(--color-success)' : pct >= 50 ? 'var(--color-accent)' : 'var(--color-error)');

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--bg-slate)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease' }}
        />
      </svg>
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        {label && (
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: size > 100 ? '1.75rem' : '1.125rem', fontWeight: 800, color: 'inherit', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {label}
          </div>
        )}
        {sublabel && (
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: 4 }}>{sublabel}</div>
        )}
      </div>
    </div>
  );
}
