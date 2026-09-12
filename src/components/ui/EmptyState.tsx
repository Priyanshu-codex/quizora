import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon && (
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'var(--bg-slate)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)',
          }}
        >
          {icon}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', maxWidth: 360 }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.015em' }}>
          {title}
        </p>
        {description && (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            {description}
          </p>
        )}
      </div>
      {action && <div style={{ marginTop: 6 }}>{action}</div>}
    </div>
  );
}
