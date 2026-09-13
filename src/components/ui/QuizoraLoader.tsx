'use client';

import React from 'react';
import { Zap } from 'lucide-react';

interface QuizoraLoaderProps {
  message?: string;
  subtitle?: string;
  fullScreen?: boolean;
}

export default function QuizoraLoader({
  message = 'Preparing your quiz space…',
  subtitle,
  fullScreen = true,
}: QuizoraLoaderProps) {
  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 40px',
        background: '#FFFFFF',
        borderRadius: '24px',
        border: '1px solid rgba(2, 132, 199, 0.12)',
        boxShadow: '0 12px 36px -4px rgba(2, 132, 199, 0.1), 0 4px 12px -2px rgba(15, 23, 42, 0.04)',
        maxWidth: 390,
        width: '90%',
        textAlign: 'center',
        animation: 'quizora-fade-in 200ms ease-out forwards',
        zIndex: 9999,
      }}
    >
      {/* Quiz / Learning Animation Icon Area */}
      <div
        style={{
          position: 'relative',
          width: 68,
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        {/* Soft Outer Pulse Ring */}
        <div
          style={{
            position: 'absolute',
            inset: -8,
            borderRadius: '24px',
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.2) 0%, rgba(2, 132, 199, 0) 70%)',
            animation: 'quizora-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />

        {/* Orbiting Quiz Learning Nodes (A, B, C question options representation) */}
        <div className="quizora-orbit-ring">
          <div className="quizora-orbit-dot dot-1">A</div>
          <div className="quizora-orbit-dot dot-2">B</div>
          <div className="quizora-orbit-dot dot-3">C</div>
        </div>

        {/* Center Brand Squircle */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 18px -2px rgba(2, 132, 199, 0.38)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <Zap size={26} fill="#FFFFFF" stroke="#FFFFFF" />
        </div>
      </div>

      {/* Brand Name */}
      <div
        style={{
          fontFamily: 'var(--font-heading, "Plus Jakarta Sans", ui-sans-serif, sans-serif)',
          fontSize: '1.25rem',
          fontWeight: 800,
          color: '#0F172A',
          letterSpacing: '-0.03em',
          lineHeight: 1.2,
          marginBottom: 6,
        }}
      >
        Quizora
      </div>

      {/* Branded Status Message */}
      <div
        style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#0284C7',
          letterSpacing: '-0.01em',
          marginBottom: subtitle ? 4 : 20,
        }}
      >
        {message}
      </div>

      {/* Optional Subtitle */}
      {subtitle && (
        <div
          style={{
            fontSize: '0.8125rem',
            color: '#64748B',
            marginBottom: 20,
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </div>
      )}

      {/* Smooth Continuous Learning Progress Bar */}
      <div
        style={{
          width: '100%',
          maxWidth: 220,
          height: 5,
          background: 'rgba(2, 132, 199, 0.1)',
          borderRadius: 9999,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '45%',
            background: 'linear-gradient(90deg, #0284C7 0%, #38BDF8 100%)',
            borderRadius: 9999,
            animation: 'quizora-slide 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          }}
        />
      </div>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes quizora-fade-in {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes quizora-pulse {
          0%, 100% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0.9; }
        }
        @keyframes quizora-slide {
          0% { left: -45%; }
          100% { left: 100%; }
        }
        @keyframes quizora-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .quizora-orbit-ring {
          position: absolute;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          animation: quizora-spin 4s linear infinite;
          pointer-events: none;
        }
        .quizora-orbit-dot {
          position: absolute;
          width: 17px;
          height: 17px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 1.5px solid #0EA5E9;
          color: #0284C7;
          font-size: 8px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(2, 132, 199, 0.18);
        }
        .dot-1 {
          top: -4px;
          left: calc(50% - 8.5px);
        }
        .dot-2 {
          bottom: 2px;
          right: 0px;
        }
        .dot-3 {
          bottom: 2px;
          left: 0px;
        }
      `}</style>
    </div>
  );

  if (!fullScreen) {
    return content;
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        height: '100dvh',
        width: '100vw',
        maxWidth: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F8FAFC',
        padding: 24,
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
      }}
    >
      {content}
    </div>
  );
}
