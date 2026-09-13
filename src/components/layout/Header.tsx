'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Menu, Calendar, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/utils/formatters';
import Link from 'next/link';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'New Quiz Published',
    message: 'Demo Quiz 1: Modern Web Engineering is live for participants.',
    time: '10m ago',
    read: false,
    type: 'info',
  },
  {
    id: 'n2',
    title: 'High Score Achieved',
    message: 'Aarav Sharma completed Demo Quiz 2: Data Structures & Algorithms.',
    time: '1h ago',
    read: false,
    type: 'success',
  },
  {
    id: 'n3',
    title: 'Proctoring Security',
    message: 'Test Lock mode enabled for all published quizzes.',
    time: '3h ago',
    read: true,
    type: 'info',
  },
];

export default function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;
  const initials = getInitials(user.name);

  const rolePill: Record<string, string> = {
    admin: 'badge-primary',
    viewer: 'badge-gold',
    user: 'badge-success',
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="header" style={{ position: 'sticky', top: 0, zIndex: 40, borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="btn btn-ghost btn-icon desktop-hidden"
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      {/* Title & Subtitle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.125rem',
              fontWeight: 800,
              margin: 0,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h1>
          {user.role === 'admin' && (
            <span className="badge badge-primary hide-mobile" style={{ fontSize: '0.625rem', letterSpacing: '0.05em' }}>
              ADMIN CONSOLE
            </span>
          )}
        </div>
        {subtitle && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{subtitle}</p>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {/* Date pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: 'var(--bg-slate)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
          }}
          className="hide-mobile"
        >
          <Calendar size={13} style={{ color: 'var(--color-primary)' }} />
          <span>{todayStr}</span>
        </div>

        {/* Notifications Popover */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost btn-icon"
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ position: 'relative' }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--color-error)',
                  border: '2px solid var(--bg-surface)',
                }}
              />
            )}
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: 'min(340px, calc(100vw - 32px))',
                maxWidth: 'calc(100vw - 32px)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                zIndex: 100,
                overflow: 'hidden',
                animation: 'fadeSlideDown 150ms ease-out',
              }}
            >
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{ background: 'var(--color-primary)', color: '#FFF', fontSize: '0.6875rem', fontWeight: 800, padding: '1px 6px', borderRadius: 'var(--radius-full)' }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: n.read ? 'transparent' : 'var(--color-primary-light)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        transition: 'background var(--transition-fast)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{n.title}</span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{n.time}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 2px' }} />

        {/* User Profile Menu */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '4px 6px', borderRadius: 'var(--radius-md)', transition: 'background var(--transition-fast)' }}
            className="hover-bg-slate"
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--gradient-primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                border: '2px solid #BAE6FD',
                boxShadow: 'var(--shadow-xs)',
              }}
              aria-label={`Profile — ${user.name}`}
            >
              {initials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }} className="hide-mobile">
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {user.name}
              </span>
              <span className={`badge ${rolePill[user.role] ?? 'badge-neutral'}`} style={{ fontSize: '0.625rem', textTransform: 'capitalize', width: 'fit-content', padding: '1px 6px', marginTop: 2 }}>
                {user.role}
              </span>
            </div>
          </div>

          {showProfileMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: 'min(240px, calc(100vw - 32px))',
                maxWidth: 'calc(100vw - 32px)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                zIndex: 100,
                overflow: 'hidden',
                animation: 'fadeSlideDown 150ms ease-out',
                padding: '6px',
              }}
            >
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 4 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{user.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</p>
              </div>

              {(user.role === 'admin' || user.role === 'viewer') && (
                <Link
                  href={user.role === 'admin' ? '/admin/settings' : '/viewer/settings'}
                  onClick={() => setShowProfileMenu(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                  className="dropdown-item-hover"
                >
                  <Settings size={16} style={{ color: 'var(--color-primary)' }} />
                  <span>{user.role === 'admin' ? 'Admin Settings' : 'Settings'}</span>
                </Link>
              )}

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8125rem',
                  color: 'var(--color-error)',
                  background: 'transparent',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                className="dropdown-item-hover-danger"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dropdown-item-hover:hover {
          background: var(--bg-slate);
          color: var(--color-primary) !important;
        }
        .dropdown-item-hover-danger:hover {
          background: var(--color-error-light);
        }
        .hover-bg-slate:hover {
          background: var(--bg-slate);
        }
        @media (max-width: 1024px) {
          .desktop-hidden { display: flex !important; }
        }
        @media (max-width: 640px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </header>
  );
}

