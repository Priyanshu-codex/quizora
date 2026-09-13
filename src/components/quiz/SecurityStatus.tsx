'use client';

import { Lock } from 'lucide-react';

interface SecurityStatusProps {
  violations?: number;
  maxViolations?: number;
}

export default function SecurityStatus({}: SecurityStatusProps = {}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 12px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-primary-light)',
        border: '1px solid var(--color-primary-border)',
      }}
    >
      <Lock size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
      <span
        style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--color-primary)',
          whiteSpace: 'nowrap',
          letterSpacing: '0.02em',
        }}
      >
        Test Lock Active
      </span>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--color-success)',
          flexShrink: 0,
          boxShadow: '0 0 6px var(--color-success)',
        }}
      />
    </div>
  );
}
