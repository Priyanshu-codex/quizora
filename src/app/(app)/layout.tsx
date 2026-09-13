'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { canAccess, getHomeRoute } from '@/utils/rbac';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';

// Map pathnames to page titles
function getPageTitle(pathname: string): { title: string; subtitle?: string } {
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1] ?? '';

  const titles: Record<string, { title: string; subtitle?: string }> = {
    dashboard: { title: 'Dashboard' },
    quizzes: { title: 'Quizzes' },
    participants: { title: 'Participants' },
    results: { title: 'Results' },
    analytics: { title: 'Analytics' },
    settings: { title: 'Settings' },
    new: { title: 'Create Quiz' },
    edit: { title: 'Edit Quiz' },
  };

  return titles[last] ?? { title: 'Quizora' };
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, isInitialized } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (isInitialized && !isLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
        return;
      }
      if (user && !canAccess(pathname, user.role)) {
        router.replace(getHomeRoute(user.role));
      }
    }
  }, [isInitialized, isLoading, isAuthenticated, user, pathname, router]);

  // Close mobile nav on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileNavOpen(false);
  }, [pathname]);

  // Render a stable loading spinner shell while auth state initializes
  if (!isInitialized || isLoading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
        <div
          className="animate-spin"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '3px solid var(--border)',
            borderTopColor: 'var(--color-primary)',
          }}
        />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  const { title, subtitle } = getPageTitle(pathname);

  return (
    <div
      style={{
        display: 'flex',
        height: '100dvh',
        maxHeight: '100dvh',
        width: '100vw',
        maxWidth: '100%',
        overflow: 'hidden',
        background: 'var(--bg-app)',
      }}
    >
      {/* Desktop sidebar */}
      <div className="sidebar-wrapper">
        <Sidebar />
      </div>

      {/* Mobile nav drawer */}
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <Header
          title={title}
          subtitle={subtitle}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main className="content-area" id="main-content">
          <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', width: '100%' }}>
            {children}
          </div>
        </main>
      </div>

      <style>{`
        .sidebar-wrapper {
          display: block;
          width: var(--sidebar-width);
          flex-shrink: 0;
          height: 100dvh;
          position: sticky;
          top: 0;
          z-index: 40;
        }
        @media (max-width: 1024px) {
          .sidebar-wrapper { display: none; }
        }
      `}</style>
    </div>
  );
}
