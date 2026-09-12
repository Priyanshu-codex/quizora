import { UserRole } from '@/types';

// Routes accessible per role
export const ROLE_HOME: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  viewer: '/viewer/dashboard',
  user: '/user/dashboard',
};

export const ADMIN_ROUTES = ['/admin'];
export const VIEWER_ROUTES = ['/viewer'];
export const USER_ROUTES = ['/user'];

export function getHomeRoute(role: UserRole): string {
  return ROLE_HOME[role];
}

export function canAccess(pathname: string, role: UserRole): boolean {
  if (pathname.startsWith('/admin') && role !== 'admin') return false;
  if (pathname.startsWith('/viewer') && role !== 'viewer') return false;
  if (pathname.startsWith('/user') && role !== 'user') return false;
  return true;
}

export function isWriteAction(role: UserRole): boolean {
  return role === 'admin';
}

export function isReadOnly(role: UserRole): boolean {
  return role === 'viewer';
}
