import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  color?: string;
  subtitle?: string;
  badge?: string;
}

export default function StatCard({ label, value, icon, trend, color, subtitle, badge }: StatCardProps) {
  const accentColor = color || 'var(--color-primary)';

  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <p
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                margin: 0,
              }}
            >
              {label}
            </p>
            {badge && (
              <span className="badge badge-gold" style={{ fontSize: '0.625rem', padding: '1px 6px' }}>
                {badge}
              </span>
            )}
          </div>
          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '2rem',
              fontWeight: 800,
              margin: 0,
              color: 'var(--text-primary)',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
            }}
          >
            {value}
          </p>
          {subtitle && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '6px 0 0' }}>{subtitle}</p>
          )}
        </div>
        {icon && (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-slate)',
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid var(--border)',
            }}
          >
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 6, borderTop: '1px solid var(--border-subtle)', marginTop: 4 }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: trend.value >= 0 ? 'var(--color-success)' : 'var(--color-error)',
            }}
          >
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{trend.label}</span>
        </div>
      )}
    </div>
  );
}
