'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Zap, LayoutDashboard, BookOpen, Users, BarChart3,
  Settings, FileText, ChevronRight, LogOut, ShieldAlert
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import { getInitials } from '@/utils/formatters';

interface NavGroup {
  items: { label: string; href: string; icon: React.ReactNode }[];
}

function getNavGroups(role: string): NavGroup[] {
  if (role === 'admin') {
    return [
      {
        items: [
          { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={17} /> },
          { label: 'Quizzes', href: '/admin/quizzes', icon: <BookOpen size={17} /> },
          { label: 'Participants', href: '/admin/participants', icon: <Users size={17} /> },
          { label: 'Results', href: '/admin/results', icon: <FileText size={17} /> },
          { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 size={17} /> },
          { label: 'Settings', href: '/admin/settings', icon: <Settings size={17} /> },
        ],
      },
    ];
  }
  if (role === 'viewer') {
    return [
      {
        items: [
          { label: 'Dashboard', href: '/viewer/dashboard', icon: <LayoutDashboard size={17} /> },
          { label: 'Quizzes', href: '/viewer/quizzes', icon: <BookOpen size={17} /> },
          { label: 'Participants', href: '/viewer/participants', icon: <Users size={17} /> },
          { label: 'Results', href: '/viewer/results', icon: <FileText size={17} /> },
          { label: 'Analytics', href: '/viewer/analytics', icon: <BarChart3 size={17} /> },
        ],
      },
    ];
  }
  // user
  return [
    {
      items: [
        { label: 'Dashboard', href: '/user/dashboard', icon: <LayoutDashboard size={17} /> },
        { label: 'My Quizzes', href: '/user/quizzes', icon: <BookOpen size={17} /> },
        { label: 'My Results', href: '/user/results', icon: <FileText size={17} /> },
      ],
    },
  ];
}

interface SidebarProps {
  onNavClick?: () => void;
}

export default function Sidebar({ onNavClick }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { success } = useToast();
  const router = useRouter();

  if (!user) return null;

  const navGroups = getNavGroups(user.role);
  const initials = getInitials(user.name);

  async function handleLogout() {
    await logout();
    success('Signed out', 'You have been signed out successfully.');
    router.push('/login');
  }

  const rolePill: Record<string, string> = {
    admin: 'badge-gold',
    viewer: 'badge-primary',
    user: 'badge-neutral',
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '22px 20px 18px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'var(--gradient-primary)',
            border: '1px solid var(--color-primary-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)',
            flexShrink: 0,
          }}
        >
          <Zap size={19} fill="#FFFFFF" stroke="#FFFFFF" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
          >
            Quizora
          </span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            Assessment Platform
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
        {navGroups.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 12 }}>
            {group.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && item.href !== '/user/dashboard' && item.href !== '/viewer/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavClick}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{item.label}</span>
                  {isActive && (
                    <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--color-primary)' }} />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Viewer Notice if viewer role */}
      {user.role === 'viewer' && (
        <div style={{ padding: '0 12px 12px' }}>
          <div style={{ padding: '10px 12px', background: 'var(--color-accent-gold-bg)', border: '1px solid var(--color-accent-gold-border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={15} style={{ color: 'var(--color-accent-gold-text)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-gold-text)', fontWeight: 600 }}>Read-Only Mode</span>
          </div>
        </div>
      )}

      {/* User footer */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '14px 12px', flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 12px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-slate)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--color-primary)',
              color: '#FFFFFF',
              border: '2px solid #BAE6FD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8125rem',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span className={`badge ${rolePill[user.role] ?? 'badge-neutral'}`} style={{ fontSize: '0.625rem', textTransform: 'capitalize' }}>
                {user.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-icon"
            style={{ width: 32, height: 32, flexShrink: 0, color: 'var(--text-muted)' }}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
