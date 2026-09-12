'use client';

import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  maxWidth?: number | string;
  showClose?: boolean;
}

export default function Modal({ isOpen, onClose, title, children, size = 'md', maxWidth, showClose = true }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const defaultMaxWidths = { sm: '420px', md: '520px', lg: '720px' };
  const effectiveMaxWidth = maxWidth
    ? typeof maxWidth === 'number'
      ? `${maxWidth}px`
      : maxWidth
    : defaultMaxWidths[size];

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-card" style={{ maxWidth: effectiveMaxWidth }}>
        {title && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px 16px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-slate)',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.0625rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.015em' }}>
              {title}
            </h2>
            {showClose && (
              <button onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Close modal" style={{ width: 32, height: 32 }}>
                <X size={16} />
              </button>
            )}
          </div>
        )}
        <div style={{ padding: title ? '20px 24px 24px' : '28px 24px' }}>{children}</div>
      </div>
    </div>
  );
}
