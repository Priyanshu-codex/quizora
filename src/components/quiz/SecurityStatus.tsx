'use client';

import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface SecurityStatusProps {
  violations: number;
  maxViolations: number;
}

export default function SecurityStatus({ violations, maxViolations }: SecurityStatusProps) {
  const isClean = violations === 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        borderRadius: 'var(--radius-full)',
        background: isClean ? 'var(--bg-slate)' : 'var(--color-error-light)',
        border: `1px solid ${isClean ? 'var(--border)' : 'var(--color-error)'}`,
      }}
    >
      {isClean ? (
        <ShieldCheck size={14} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
      ) : (
        <ShieldAlert size={14} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
      )}
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isClean ? 'var(--text-primary)' : 'var(--color-error)' }}>
        {isClean ? 'Secure Quiz Mode' : `Violations: ${violations}/${maxViolations}`}
      </span>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: isClean ? 'var(--color-success)' : 'var(--color-error)',
        }}
      />
    </div>
  );
}
