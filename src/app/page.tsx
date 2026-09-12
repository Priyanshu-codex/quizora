'use client';

import Link from 'next/link';
import { Zap, ArrowRight, ShieldCheck, Award, Clock, CheckCircle2, Sparkles, BookOpen, ChevronRight } from 'lucide-react';
import ProgressRing from '@/components/quiz/ProgressRing';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-app)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* ── TOP NAV ── */}
      <header
        style={{
          height: 72,
          padding: '0 clamp(20px, 4vw, 48px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'var(--gradient-primary)',
              border: '1px solid var(--color-primary-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-brand)',
            }}
          >
            <Zap size={20} fill="#FFFFFF" stroke="#FFFFFF" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1.1 }}>
              Quizora
            </span>
            <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Assessment Platform
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/login" className="btn btn-ghost btn-md" style={{ textDecoration: 'none', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Explore Quizzes
          </Link>
          <Link href="/login" className="btn btn-primary btn-md" style={{ textDecoration: 'none' }}>
            Sign In <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'clamp(40px, 6vh, 80px) clamp(20px, 4vw, 48px)' }}>
        <div style={{ maxWidth: 1200, width: '100%', display: 'flex', flexDirection: 'column', gap: 56, alignItems: 'center' }}>
          
          {/* Headline & Editorial Copy */}
          <div style={{ textAlign: 'center', maxWidth: 800, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-primary-light)',
                border: '1px solid var(--color-primary-border)',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-primary)',
              }}
            >
              <Sparkles size={14} style={{ color: 'var(--color-primary)' }} /> Next-Generation Assessment Engine
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: '-0.035em',
                margin: 0,
                color: 'var(--text-primary)',
              }}
            >
              Challenge Your <br />
              <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Knowledge & Skills.
              </span>
            </h1>

            <p
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: 0,
                maxWidth: 620,
              }}
            >
              Timed assessments, live proctoring security, instant AI performance analytics, and seamless quiz management for teams and participants.
            </p>

            <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/login" className="btn btn-primary btn-xl" style={{ textDecoration: 'none' }}>
                <BookOpen size={18} /> Explore Catalog
              </Link>
              <Link href="/login" className="btn btn-secondary btn-xl" style={{ textDecoration: 'none' }}>
                Sign In to Platform <ChevronRight size={18} />
              </Link>
            </div>
          </div>

          {/* Light Airy Showcase Section */}
          <div
            style={{
              width: '100%',
              maxWidth: 1040,
              background: 'linear-gradient(145deg, #F0F9FF 0%, #FFFFFF 50%, #F8FAFC 100%)',
              borderRadius: 'var(--radius-2xl)',
              padding: 'clamp(28px, 4vw, 48px)',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid var(--border)',
            }}
          >
            {/* Background subtle mesh grid */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(rgba(2, 132, 199, 0.08) 1.5px, transparent 1.5px)',
                backgroundSize: '24px 24px',
                opacity: 0.8,
                pointerEvents: 'none',
              }}
            />

            <div style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 28, alignItems: 'center' }}>
              
              {/* Mock Active Quiz Card */}
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.6875rem' }}>
                    QUESTION 04 OF 20
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                    <Clock size={14} /> 24:18 remaining
                  </div>
                </div>

                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.0625rem', fontWeight: 700, lineHeight: 1.4, color: 'var(--text-primary)' }}>
                  Which data structure guarantees logarithmic time complexity for search operations in balanced trees?
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-app)', border: '1px solid var(--border)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    A. Unsorted Linked List
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-success-light)', border: '1px solid #A7F3D0', fontSize: '0.8125rem', color: '#059669', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>B. Red-Black Tree / AVL Tree — O(log n)</span>
                    <CheckCircle2 size={16} style={{ color: '#059669' }} />
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-app)', border: '1px solid var(--border)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    C. Hash Table Worst-Case
                  </div>
                </div>
              </div>

              {/* Performance & Proctoring Widgets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* Score Ring Card */}
                <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 20, display: 'flex', alignItems: 'center', gap: 20, boxShadow: 'var(--shadow-sm)', flexWrap: 'wrap' }}>
                  <ProgressRing value={94} size={84} strokeWidth={8} color="var(--color-primary)" label="94%" />
                  <div style={{ minWidth: 0, flex: '1 1 140px' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary)', fontWeight: 700 }}>
                      Performance Rating
                    </span>
                    <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 4px', color: 'var(--text-primary)' }}>
                      Distinction Level
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                      Top percentile score achieved
                    </p>
                  </div>
                </div>

                {/* Micro Widgets */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: 14 }}>
                  <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 14, display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow-xs)' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--color-success-light)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)' }}>Anti-Cheat</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Proctoring Enabled</div>
                    </div>
                  </div>

                  <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 14, display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow-xs)' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--color-warning-light)', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Award size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)' }}>Instant Result</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Detailed Review</div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px clamp(20px, 4vw, 48px)', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)', background: 'var(--bg-surface)' }}>
        &copy; 2026 Quizora Inc. All rights reserved. Enterprise Quiz & Assessment System.
      </footer>
    </div>
  );
}
