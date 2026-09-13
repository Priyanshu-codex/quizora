'use client';

import { useState, useEffect } from 'react';
import { User as UserIcon, Check, AlertCircle, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getInitials } from '@/utils/formatters';

export default function ChangeNameCard() {
  const { user, updateName } = useAuth();
  const { success, error: toastError } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (user?.name) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(user.name);
    }
  }, [user?.name]);

  if (!user) return null;

  const trimmed = name.trim();
  const isChanged = trimmed !== user.name && trimmed.length > 0;
  const initials = getInitials(trimmed || user.name);

  function validate(val: string): boolean {
    const t = val.trim();
    if (!t) {
      setError('Display name cannot be empty.');
      return false;
    }
    if (t.length < 2) {
      setError('Display name must be at least 2 characters.');
      return false;
    }
    if (t.length > 60) {
      setError('Display name cannot exceed 60 characters.');
      return false;
    }
    setError(null);
    return true;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setName(val);
    setJustSaved(false);
    if (error) {
      validate(val);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate(name)) return;
    if (!isChanged) return;

    setSaving(true);
    setError(null);
    try {
      await updateName(trimmed);
      success('Display name updated!', `Your name is now "${trimmed}".`);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to update name. Please try again.';
      setError(msg);
      toastError('Update failed', msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--gradient-primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9375rem',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              border: '2px solid #BAE6FD',
              boxShadow: 'var(--shadow-sm)',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Profile Display Name
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Update your display name across all dashboards, greetings, and reports.
            </p>
          </div>
        </div>

        <span className="badge badge-neutral" style={{ textTransform: 'capitalize', fontSize: '0.75rem' }}>
          {user.role} Account
        </span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-group">
          <label htmlFor="displayNameInput" className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Display Name</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {trimmed.length}/60
            </span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="displayNameInput"
              className={`input-base ${error ? 'input-error' : ''}`}
              type="text"
              placeholder="e.g. Alex Morgan"
              value={name}
              onChange={handleChange}
              onBlur={() => validate(name)}
              disabled={saving}
              maxLength={60}
              autoComplete="name"
              style={{ paddingLeft: 38 }}
            />
            <UserIcon
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: error ? 'var(--color-error)' : 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, color: 'var(--color-error)', fontSize: '0.75rem', fontWeight: 600 }}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="submit"
            className="btn btn-primary btn-md"
            disabled={saving || !isChanged || !!error}
            style={{ minWidth: 130 }}
          >
            {saving ? (
              <>
                <span
                  className="animate-spin"
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    display: 'inline-block',
                  }}
                />
                <span>Updating...</span>
              </>
            ) : justSaved ? (
              <>
                <Check size={15} />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Save Name</span>
              </>
            )}
          </button>

          {isChanged && !saving && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setName(user.name);
                setError(null);
              }}
              style={{ color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
          )}

          {justSaved && (
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Check size={14} /> Updated everywhere
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
