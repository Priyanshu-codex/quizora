'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/types';
import { authService, LoginCredentials, SignUpData } from '@/services/authService';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  signUp: (data: SignUpData) => Promise<User>;
  logout: () => Promise<void>;
  updateName: (newName: string) => Promise<User>;
  role: UserRole | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const session = authService.getSession();
        return session?.user ?? null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isInitialized] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize session on mount & listen to auth state changes
  useEffect(() => {
    // If Supabase is active, listen to auth state changes
    if (isSupabaseConfigured()) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, sbSession: Session | null) => {
        if (event === 'SIGNED_OUT' || !sbSession) {
          setUser(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('quizora_session');
          }
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
          const metaRole = sbSession.user.user_metadata?.role as UserRole | undefined;
          const metaName = sbSession.user.user_metadata?.name as string | undefined;

          // Fast path: if metadata already has role & name, sync instantly without extra network query
          if (metaRole && metaName) {
            setUser((prev) => {
              if (prev && prev.id === sbSession.user.id && prev.role === metaRole && prev.name === metaName) {
                return prev; // Reference identity preserved -> zero re-renders
              }
              return {
                id: sbSession.user.id,
                name: metaName,
                email: sbSession.user.email || '',
                role: metaRole,
                avatar: sbSession.user.user_metadata?.avatar,
                createdAt: sbSession.user.created_at,
              };
            });
            return;
          }

          // Fallback: fetch profile from database only if metadata is incomplete
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', sbSession.user.id)
            .maybeSingle();

          const updatedUser: User = {
            id: sbSession.user.id,
            name: profile?.name || sbSession.user.user_metadata?.name || sbSession.user.email?.split('@')[0] || 'User',
            email: sbSession.user.email || '',
            role: (profile?.role as UserRole) || (sbSession.user.user_metadata?.role as UserRole) || 'user',
            avatar: profile?.avatar_url || sbSession.user.user_metadata?.avatar,
            createdAt: sbSession.user.created_at,
          };
          setUser(updatedUser);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<User> => {
    setIsLoading(true);
    try {
      const session = await authService.login(credentials);
      setUser(session.user);
      return session.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (data: SignUpData): Promise<User> => {
    setIsLoading(true);
    try {
      const session = await authService.signUp(data);
      setUser(session.user);
      return session.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const updateName = useCallback(async (newName: string): Promise<User> => {
    if (!user) throw new Error('No authenticated user.');
    const updated = await authService.updateName(user.id, newName);
    setUser(updated);
    return updated;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        isInitialized,
        login,
        signUp,
        logout,
        updateName,
        role: user?.role ?? null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
