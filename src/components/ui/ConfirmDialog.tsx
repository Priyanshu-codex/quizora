'use client';

import Modal from './Modal';
import { Trash2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete Permanently',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showClose={false}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, padding: '8px 4px' }}>
        {variant === 'danger' && (
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              background: 'var(--color-error-light)',
              border: '1px solid var(--color-error)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 size={24} style={{ color: 'var(--color-error)' }} />
          </div>
        )}
        <div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {title}
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
            {message}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 6, flexWrap: 'wrap' }}>
          <button onClick={onClose} className="btn btn-secondary btn-md" style={{ flex: '1 1 120px' }} disabled={isLoading}>
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`btn btn-md ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            style={{ flex: '1 1 120px' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="animate-spin" style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block' }} />
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
