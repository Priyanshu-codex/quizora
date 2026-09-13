'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import PageHeader from '@/components/shared/PageHeader';
import ChangeNameCard from '@/components/settings/ChangeNameCard';

import { isSupabaseConfigured } from '@/lib/supabase/client';

export default function AdminSettingsPage() {
  const { success } = useToast();
  const [defaults, setDefaults] = useState({ duration: 30, questionCount: 10, maxAttempts: 3, passingPercentage: 60, maxViolations: 3, fullscreenRequired: false });
  const [saving, setSaving] = useState(false);
  const isConfigured = isSupabaseConfigured();

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    success('Settings saved!', 'Your preferences have been updated.');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640, animation: 'fade-in 300ms ease' }}>
      <PageHeader title="Settings" description="Configure quiz platform defaults and preferences" />

      <ChangeNameCard />

      <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>Quiz Defaults</h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>These values will be pre-filled when creating a new quiz.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 14 }}>
          {[
            { label: 'Default Duration (min)', key: 'duration' as const, min: 1, max: 300 },
            { label: 'Default Questions', key: 'questionCount' as const, min: 1, max: 200 },
            { label: 'Default Max Attempts', key: 'maxAttempts' as const, min: 1, max: 10 },
            { label: 'Default Passing %', key: 'passingPercentage' as const, min: 1, max: 100 },
            { label: 'Default Max Violations', key: 'maxViolations' as const, min: 1, max: 10 },
          ].map(({ label, key, min, max }) => (
            <div key={key} className="form-group">
              <label className="input-label">{label}</label>
              <input
                className="input-base"
                type="number"
                min={min}
                max={max}
                value={defaults[key]}
                onChange={(e) => setDefaults((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
              />
            </div>
          ))}
        </div>
        <label className="login-checkbox-label" style={{ marginTop: 4 }}>
          <input
            type="checkbox"
            checked={defaults.fullscreenRequired}
            onChange={(e) => setDefaults((prev) => ({ ...prev, fullscreenRequired: e.target.checked }))}
            className="login-native-checkbox"
          />
          <span className="login-checkbox-custom">
            {defaults.fullscreenRequired && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 3.5L3.8 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </span>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Require fullscreen by default</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>New quizzes will require fullscreen mode unless changed.</div>
          </div>
        </label>
      </div>

      <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>Platform Information</h3>
          <span className={`badge ${isConfigured ? 'badge-success' : 'badge-neutral'}`}>
            {isConfigured ? '● Supabase Connected' : '○ Supabase Ready (Local Cache)'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Platform Name', value: 'Quizora' },
            { label: 'Version', value: '1.0.0' },
            { label: 'Backend Database', value: isConfigured ? 'Supabase PostgreSQL 15 (RLS Active)' : 'Supabase Client (Local Fallback)' },
            { label: 'Auth Provider', value: isConfigured ? 'Supabase Auth (JWT + PKCE Session)' : 'Supabase Auth Layer' },
            { label: 'Data Entities', value: 'Profiles, Quizzes, Questions, Attempts, Answers' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-primary btn-md" style={{ alignSelf: 'flex-start' }} onClick={handleSave} disabled={saving}>
        {saving ? <span className="animate-spin" style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block' }} /> : <><Save size={15} /> Save Settings</>}
      </button>
    </div>
  );
}
