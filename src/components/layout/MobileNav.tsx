'use client';

import { useEffect } from 'react';
import Sidebar from './Sidebar';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 200,
          animation: 'fade-in 200ms ease forwards',
        }}
        aria-hidden="true"
      />
      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          height: '100dvh',
          maxHeight: '100dvh',
          width: 'min(var(--sidebar-width, 260px), 85vw)',
          maxWidth: '85vw',
          zIndex: 201,
          animation: 'slide-in-left 250ms ease forwards',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <Sidebar onNavClick={onClose} />
      </div>
    </>
  );
}
