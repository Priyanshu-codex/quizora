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
      <span className="security-status-text" style={{ fontSize: '0.75rem', fontWeight: 700, color: isClean ? 'var(--text-primary)' : 'var(--color-error)', whiteSpace: 'nowrap' }}>
        <span className="security-status-full">{isClean ? 'Secure Quiz Mode' : `Violations: ${violations}/${maxViolations}`}</span>
        <span className="security-status-compact">{isClean ? 'Secure' : `${violations}/${maxViolations}`}</span>
      </span>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: isClean ? 'var(--color-success)' : 'var(--color-error)',
          flexShrink: 0,
        }}
      />
      <style jsx>{`
        .security-status-full { display: inline; }
        .security-status-compact { display: none; }
        @media (max-width: 640px) {
          .security-status-full { display: none; }
          .security-status-compact { display: inline; }
        }
      `}</style>
    </div>
  );
}
