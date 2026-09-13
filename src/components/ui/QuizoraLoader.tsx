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
        padding: '36px 44px',
        background: 'var(--bg-surface, #ffffff)',
        borderRadius: 'var(--radius-2xl, 20px)',
        border: '1px solid var(--border-subtle, rgba(2, 132, 199, 0.12))',
        boxShadow: '0 10px 30px -5px rgba(2, 132, 199, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04)',
        maxWidth: 380,
        width: '90%',
        textAlign: 'center',
        animation: 'fade-in 250ms ease-out forwards',
      }}
    >
      {/* Brand Mark with Smooth Gentle Pulse */}
      <div
        style={{
          position: 'relative',
          width: 56,
          height: 56,
          marginBottom: 20,
        }}
      >
        {/* Soft Background Glow Ring */}
        <div
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: 18,
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.22) 0%, rgba(2, 132, 199, 0) 70%)',
            animation: 'quizora-pulse 2s ease-in-out infinite',
          }}
        />
        {/* Logo Squircle */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 16px -2px rgba(2, 132, 199, 0.35)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Zap size={26} fill="#FFFFFF" stroke="#FFFFFF" />
        </div>
      </div>

      {/* Brand Title */}
      <div
        style={{
          fontFamily: 'var(--font-heading, "Plus Jakarta Sans", sans-serif)',
          fontSize: '1.125rem',
          fontWeight: 800,
          color: 'var(--text-primary, #0f172a)',
          letterSpacing: '-0.025em',
          marginBottom: 4,
        }}
      >
        Quizora
      </div>

      {/* Primary Message */}
      <div
        style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--color-primary, #0284C7)',
          letterSpacing: '-0.01em',
          marginBottom: subtitle ? 4 : 16,
        }}
      >
        {message}
      </div>

      {/* Optional Subtitle */}
      {subtitle && (
        <div
          style={{
            fontSize: '0.8125rem',
            color: 'var(--text-secondary, #64748b)',
            marginBottom: 16,
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </div>
      )}

      {/* Sleek Minimal Progress Track */}
      <div
        style={{
          width: '100%',
          maxWidth: 220,
          height: 4,
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
            background: 'linear-gradient(90deg, #0284C7, #38BDF8)',
            borderRadius: 9999,
            animation: 'quizora-slide 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          }}
        />
      </div>

      {/* Micro Keyframe Animations */}
      <style>{`
        @keyframes quizora-pulse {
          0%, 100% { transform: scale(0.95); opacity: 0.6; }
          50% { transform: scale(1.18); opacity: 1; }
        }
        @keyframes quizora-slide {
          0% { left: -45%; }
          100% { left: 100%; }
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
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-app, #f8fafc)',
        padding: 24,
      }}
    >
      {content}
    </div>
  );
}
