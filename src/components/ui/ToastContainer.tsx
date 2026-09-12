'use client';

import { useToast } from '@/context/ToastContext';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ICONS = {
  success: <CheckCircle size={18} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 2 }} />,
  error: <AlertCircle size={18} style={{ color: 'var(--color-error)', flexShrink: 0, marginTop: 2 }} />,
  warning: <AlertTriangle size={18} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 2 }} />,
  info: <Info size={18} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: 2 }} />,
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast animate-slide-right">
          {ICONS[toast.type]}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0, color: 'var(--text-primary)' }}>
              {toast.title}
            </p>
            {toast.message && (
              <p style={{ fontSize: '0.8125rem', margin: '2px 0 0', color: 'var(--text-secondary)' }}>
                {toast.message}
              </p>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="btn btn-ghost btn-icon"
            style={{ width: 28, height: 28, flexShrink: 0 }}
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
