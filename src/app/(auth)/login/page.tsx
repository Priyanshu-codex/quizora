'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Zap, ArrowRight, AlertCircle, User as UserIcon, GraduationCap, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getHomeRoute } from '@/utils/rbac';
import { UserRole } from '@/types';

type AuthMode = 'signin' | 'signup';

const SIGNUP_ROLES: {
  role: UserRole;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { role: 'user', label: 'Participant', icon: GraduationCap },
  { role: 'admin', label: 'Admin', icon: ShieldCheck },
  { role: 'viewer', label: 'Viewer', icon: Eye },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, signUp, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { success, error } = useToast();

  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      router.replace(getHomeRoute(user.role));
    }
  }, [isAuthenticated, authLoading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (authMode === 'signup' && !name.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Email is required.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      if (authMode === 'signup') {
        await signUp({
          email: email.trim(),
          password,
          name: name.trim(),
          role: signupRole,
        });
        success('Account Created!', 'Welcome to Quizora.');
      } else {
        await login({ email: email.trim(), password });
        success('Welcome back!', 'Redirecting to your dashboard…');
      }
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? 'Authentication failed. Please check your credentials.';
      setErrorMsg(msg);
      error('Authentication Error', msg);
    } finally {
      setIsLoading(false);
    }
  }

  if (authLoading) return null;

  return (
    <div className="login-fullscreen-root">
      {/* ── LEFT PANEL: CLEAN BRAND & TYPOGRAPHY SECTION ── */}
      <div className="login-left-brand">
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="login-logo-mark">
            <Zap size={18} className="login-logo-icon" fill="#FFFFFF" stroke="#FFFFFF" />
          </div>
          <div className="login-logo-title-group">
            <span className="login-logo-text">Quizora</span>
            <span className="login-logo-tagline">Assessment Platform</span>
          </div>
        </div>

        {/* Brand Content */}
        <div className="login-brand-content">
          <h1 className="login-brand-heading">
            Test your knowledge.<br />
            <span className="login-brand-heading-accent">Learn something new every day.</span>
          </h1>
          <p className="login-brand-description">
            A modern assessment platform built for deep learning, skill verification, and real-time progress tracking powered by Supabase.
          </p>

          {/* Minimal, Flat Educational Illustration */}
          <div className="login-subtle-graphic-wrapper">
            <svg
              viewBox="0 0 360 180"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="login-subtle-graphic"
            >
              {/* Connecting baseline stroke */}
              <path
                d="M 50 120 C 110 120, 130 55, 180 55 C 230 55, 250 95, 310 95"
                stroke="#E2E8F0"
                strokeWidth="2.5"
                strokeDasharray="5 5"
              />
              <path
                d="M 50 120 C 110 120, 130 55, 180 55"
                stroke="#BAE6FD"
                strokeWidth="2.5"
              />

              {/* Node 1: Start (Discovery) */}
              <circle cx="50" cy="120" r="18" fill="#F0F9FF" stroke="#0EA5E9" strokeWidth="2" />
              <circle cx="50" cy="120" r="6" fill="#0284C7" />
              <text x="50" y="152" textAnchor="middle" fill="#64748B" fontSize="11" fontWeight="600">Discovery</text>

              {/* Node 2: Assessment (Active) */}
              <circle cx="180" cy="55" r="22" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2.5" />
              <circle cx="180" cy="55" r="8" fill="#0EA5E9" />
              <text x="180" y="92" textAnchor="middle" fill="#0F172A" fontSize="11" fontWeight="700">Assessment</text>

              {/* Node 3: Mastery */}
              <circle cx="310" cy="95" r="18" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
              <circle cx="310" cy="95" r="6" fill="#94A3B8" />
              <text x="310" y="127" textAnchor="middle" fill="#64748B" fontSize="11" fontWeight="600">Mastery</text>
            </svg>
          </div>
        </div>

        {/* Brand Footer */}
        <div className="login-brand-footer">
          <span>&copy; {new Date().getFullYear()} Quizora Systems Inc.</span>
          <span>•</span>
          <span>Privacy & Security</span>
        </div>
      </div>

      {/* ── RIGHT PANEL: CLEAN WHITE AUTHENTICATION CANVAS ── */}
      <div className="login-right-canvas">
        <div className="login-form-area">
          {/* 1 & 2: Welcome Heading & Subtitle */}
          <div className="login-header-group">
            <h2 className="login-main-title">
              {authMode === 'signin' ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="login-main-subtitle">
              {authMode === 'signin'
                ? 'Sign in to continue your quiz journey.'
                : 'Join Quizora to take quizzes and test your skills.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-interactive-form" noValidate>
            {/* Full Name field if Sign Up */}
            {authMode === 'signup' && (
              <div className="login-field-group">
                <label className="login-field-label" htmlFor="fullName">
                  Full Name
                </label>
                <div className="login-input-wrapper">
                  <UserIcon size={17} className="login-input-icon-left" />
                  <input
                    id="fullName"
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setErrorMsg(''); }}
                    placeholder="e.g. Alex Mercer"
                    className="login-field-input"
                    autoComplete="name"
                    required
                  />
                </div>
              </div>
            )}

            {/* 3: Email field */}
            <div className="login-field-group">
              <label className="login-field-label" htmlFor="email">
                Email Address
              </label>
              <div className="login-input-wrapper">
                <Mail size={17} className="login-input-icon-left" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                  placeholder="name@example.com"
                  className="login-field-input"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* 4: Password field + Forgot Password */}
            <div className="login-field-group">
              <div className="login-field-header-row">
                <label className="login-field-label" htmlFor="password">
                  Password
                </label>
                {authMode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => success('Password Reset', 'A password reset link can be sent to your email.')}
                    className="login-forgot-link"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="login-input-wrapper">
                <Lock size={17} className="login-input-icon-left" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                  placeholder={authMode === 'signup' ? 'Min 6 characters' : '••••••••'}
                  className="login-field-input"
                  autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-input-eye-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Role picker if Sign Up */}
            {authMode === 'signup' && (
              <div className="login-field-group">
                <label className="login-field-label">Account Role</label>
                <div className="login-role-segmented-control" role="tablist">
                  {SIGNUP_ROLES.map(({ role, label, icon: RoleIcon }) => (
                    <button
                      key={role}
                      type="button"
                      role="tab"
                      aria-selected={signupRole === role}
                      onClick={() => setSignupRole(role)}
                      className={`login-role-segment-btn ${signupRole === role ? 'is-active' : ''}`}
                    >
                      <RoleIcon size={14} className="login-role-icon" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Remember Me checkbox if Sign In */}
            {authMode === 'signin' && (
              <div className="login-options-row">
                <label className="login-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="login-native-checkbox"
                  />
                  <span className="login-checkbox-custom">
                    {rememberMe && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 3.5L3.8 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  <span className="login-checkbox-text">Remember me for 30 days</span>
                </label>
              </div>
            )}

            {/* Soft Inline Error Banner */}
            {errorMsg && (
              <div className="login-alert-banner" role="alert">
                <AlertCircle size={15} className="login-alert-icon" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 5: Primary Submit Button */}
            <button
              type="submit"
              className="login-primary-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="login-btn-spinner" />
                  {authMode === 'signin' ? 'Signing in…' : 'Creating account…'}
                </>
              ) : (
                <>
                  <span>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight size={17} className="login-btn-arrow" />
                </>
              )}
            </button>
          </form>


          {/* 8: Create Account section / Sign In mode toggle */}
          <div className="login-signup-row">
            <span>
              {authMode === 'signin'
                ? "Don't have an account?"
                : 'Already have an account?'}
            </span>
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                setErrorMsg('');
              }}
              className="login-signup-link"
            >
              {authMode === 'signin' ? 'Create an account' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
