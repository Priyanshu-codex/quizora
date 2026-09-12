import { User, UserRole } from '@/types';
import { mockUsers, DEMO_CREDENTIALS } from '@/data/mockUsers';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

const SESSION_KEY = 'quizora_session';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password;

    // 1. If Supabase is configured, authenticate with real Supabase Auth
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw new Error(error.message || 'Invalid email or password. Please check your credentials.');
        }

        if (!data.user || !data.session) {
          throw new Error('Authentication returned an empty session.');
        }

        // Fetch or create profile record from public.profiles
        let userRole: UserRole = 'user';
        let userName = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User';
        let userAvatar: string | undefined = data.user.user_metadata?.avatar;

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          userRole = (profile.role as UserRole) || 'user';
          userName = profile.name || userName;
          userAvatar = profile.avatar_url || userAvatar;
        } else {
          // If profile trigger didn't catch it yet, create it directly
          const newProfile = {
            id: data.user.id,
            name: userName,
            email: data.user.email || email,
            role: (data.user.user_metadata?.role as UserRole) || 'user',
          };
          await supabase.from('profiles').insert(newProfile).select().single().catch(() => {});
          userRole = newProfile.role;
        }

        const user: User = {
          id: data.user.id,
          name: userName,
          email: data.user.email || email,
          role: userRole,
          avatar: userAvatar,
          createdAt: data.user.created_at,
        };

        const session: AuthSession = {
          user,
          token: data.session.access_token,
          expiresAt: new Date(Date.now() + (data.session.expires_in || 3600) * 1000).toISOString(),
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        }

        return session;
      } catch (err: unknown) {
        // If Supabase call failed, check if this is a known demo credential fallback
        const validDemo = Object.values(DEMO_CREDENTIALS).find(
          (c) => c.email.toLowerCase() === email && c.password === password
        );
        const demoUser = mockUsers.find((u) => u.email.toLowerCase() === email);

        if (validDemo && demoUser) {
          return this.createDemoSession(demoUser);
        }

        throw new Error((err as Error)?.message || 'Invalid email or password.');
      }
    }

    // 2. Demo credentials fallback when Supabase is not yet configured with real API keys
    const user = mockUsers.find((u) => u.email.toLowerCase() === email);
    const validCreds = Object.values(DEMO_CREDENTIALS).find(
      (c) => c.email.toLowerCase() === email && c.password === password
    );

    if (!user || !validCreds) {
      throw new Error('Invalid email or password. Please check your credentials.');
    }

    return this.createDemoSession(user);
  },

  createDemoSession(user: User): AuthSession {
    const session: AuthSession = {
      user,
      token: `demo-token-${user.id}-${Date.now()}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    return session;
  },

  async signUp(data: SignUpData): Promise<AuthSession> {
    const email = data.email.trim().toLowerCase();
    const role: UserRole = data.role || 'user';
    const name = data.name.trim();

    if (isSupabaseConfigured()) {
      const { data: authResult, error } = await supabase.auth.signUp({
        email,
        password: data.password,
        options: {
          data: {
            name,
            role,
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Unable to register account. Please try again.');
      }

      if (!authResult.user) {
        throw new Error('Registration failed to create a user account.');
      }

      // Ensure profile exists in public.profiles
      await supabase.from('profiles').upsert({
        id: authResult.user.id,
        name,
        email,
        role,
      }).catch(() => {});

      const user: User = {
        id: authResult.user.id,
        name,
        email,
        role,
        createdAt: authResult.user.created_at || new Date().toISOString(),
      };

      const session: AuthSession = {
        user,
        token: authResult.session?.access_token || `token-${user.id}-${Date.now()}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }

      return session;
    }

    // Demo fallback for local development
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
    };

    return this.createDemoSession(newUser);
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
    }
  },

  getSession(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session: AuthSession = JSON.parse(raw);
      if (new Date(session.expiresAt) < new Date()) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  getCurrentUser(): User | null {
    const session = this.getSession();
    return session?.user ?? null;
  },

  isAuthenticated(): boolean {
    return this.getSession() !== null;
  },

  async resetPassword(email: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw new Error(error.message);
    }
  },
};
