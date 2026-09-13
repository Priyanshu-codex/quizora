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
  login: (credentials: LoginCredentials) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  logout: () => Promise<void>;
  updateName: (newName: string) => Promise<User>;
  role: UserRole | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize session on mount
  useEffect(() => {
    // 1. Initial cached session
    const session = authService.getSession();
    if (session?.user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(session.user);
    }
    setIsInitialized(true);

    // 2. If Supabase is active, listen to auth state changes
    if (isSupabaseConfigured()) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, sbSession: Session | null) => {
        if (event === 'SIGNED_OUT' || !sbSession) {
          setUser(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          // Fetch freshest user profile
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

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const session = await authService.login(credentials);
      setUser(session.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (data: SignUpData) => {
    setIsLoading(true);
    try {
      const session = await authService.signUp(data);
      setUser(session.user);
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
