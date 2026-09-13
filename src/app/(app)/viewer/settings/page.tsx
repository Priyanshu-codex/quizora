'use client';

import PageHeader from '@/components/shared/PageHeader';
import ChangeNameCard from '@/components/settings/ChangeNameCard';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { ShieldAlert } from 'lucide-react';

export default function ViewerSettingsPage() {
  const isConfigured = isSupabaseConfigured();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640, animation: 'fade-in 300ms ease' }}>
      <PageHeader title="Settings" description="Manage your account profile and view platform information" />

      {/* Role explanation */}
      <div
        style={{
          padding: '14px 18px',
          background: 'var(--color-accent-gold-bg)',
          border: '1px solid var(--color-accent-gold-border)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <ShieldAlert size={18} style={{ color: 'var(--color-accent-gold-text)', flexShrink: 0 }} />
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-accent-gold-text)', lineHeight: 1.4 }}>
          <strong>Viewer Role:</strong> You have read-only access to quizzes, attempts, and analytics. You can personalize your account display name below.
        </div>
      </div>

      {/* Change Name Card */}
      <ChangeNameCard />

      {/* Platform & Account Information */}
      <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>Platform Information</h3>
          <span className={`badge ${isConfigured ? 'badge-success' : 'badge-neutral'}`}>
            {isConfigured ? '● Supabase Connected' : '○ Supabase Ready (Local Cache)'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Role', value: 'Viewer (Read-Only Auditor)' },
            { label: 'Platform Name', value: 'Quizora' },
            { label: 'Version', value: '1.0.0' },
            { label: 'Backend Database', value: isConfigured ? 'Supabase PostgreSQL 15 (RLS Active)' : 'Supabase Client (Local Fallback)' },
            { label: 'Auth Provider', value: isConfigured ? 'Supabase Auth (JWT + PKCE Session)' : 'Supabase Auth Layer' },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
                padding: '10px 0',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '0.875rem',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
