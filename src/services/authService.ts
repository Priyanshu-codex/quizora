import { User, UserRole } from '@/types';
import { mockUsers, AUTH_ACCOUNTS } from '@/data/mockUsers';
import { isValidUuid } from '@/utils/formatters';
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

interface RegisteredAccount {
  user: User;
  password: string;
}

const registeredAccounts: RegisteredAccount[] = [];

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
          const errMsg = error.message?.toLowerCase() || '';
          // If Supabase flags unconfirmed email, bypass the restriction and load profile immediately
          if (errMsg.includes('email not confirmed') || errMsg.includes('email_not_confirmed')) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('email', email)
              .maybeSingle();

            if (profile) {
              const unconfirmedUser: User = {
                id: profile.id,
                name: profile.name || email.split('@')[0],
                email: profile.email || email,
                role: (profile.role as UserRole) || 'user',
                avatar: profile.avatar_url,
                createdAt: profile.created_at || new Date().toISOString(),
              };
              const bypassSession: AuthSession = {
                user: unconfirmedUser,
                token: `token-${unconfirmedUser.id}-${Date.now()}`,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              };
              if (typeof window !== 'undefined') {
                localStorage.setItem(SESSION_KEY, JSON.stringify(bypassSession));
              }
              return bypassSession;
            }
          }
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
          .maybeSingle();

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
          try {
            await supabase.from('profiles').insert(newProfile).select().maybeSingle();
          } catch {
            // Profile trigger or insert handled
          }
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
        // If Supabase call failed, check if this is a recently registered local user or system account
        const validRegistered = registeredAccounts.find(
          (a) => a.user.email.toLowerCase() === email && a.password === password
        );
        if (validRegistered) {
          return this.createDemoSession(validRegistered.user);
        }

        const validAccount = Object.values(AUTH_ACCOUNTS).find(
          (c) => c.email.toLowerCase() === email && c.password === password
        );
        const matchedUser = mockUsers.find((u) => u.email.toLowerCase() === email);

        if (validAccount && matchedUser) {
          return this.createDemoSession(matchedUser);
        }

        throw new Error((err as Error)?.message || 'Invalid email or password.');
      }
    }

    // 2. System accounts / registered accounts fallback when Supabase is not yet configured with real API keys
    const registered = registeredAccounts.find(
      (a) => a.user.email.toLowerCase() === email && a.password === password
    );
    if (registered) {
      return this.createDemoSession(registered.user);
    }

    const user = mockUsers.find((u) => u.email.toLowerCase() === email);
    const validCreds = Object.values(AUTH_ACCOUNTS).find(
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
      try {
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

        if (authResult.user) {
          // Ensure profile exists in public.profiles
          try {
            await supabase.from('profiles').upsert({
              id: authResult.user.id,
              name,
              email,
              role,
            });
          } catch {
            // Handled or non-blocking
          }

          // Immediately sign in if session was not returned, bypassing email confirmation requirement
          let token = authResult.session?.access_token;
          if (!token) {
            try {
              const { data: signInData } = await supabase.auth.signInWithPassword({
                email,
                password: data.password,
              });
              if (signInData?.session) {
                token = signInData.session.access_token;
              }
            } catch {
              // Non-blocking fallback
            }
          }

          const user: User = {
            id: authResult.user.id,
            name,
            email,
            role,
            createdAt: authResult.user.created_at || new Date().toISOString(),
          };

          const session: AuthSession = {
            user,
            token: token || `token-${user.id}-${Date.now()}`,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          };

          registeredAccounts.push({ user, password: data.password });

          if (typeof window !== 'undefined') {
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
          }

          return session;
        }
      } catch (err: unknown) {
        if (err instanceof Error && !err.message.includes('network') && !err.message.includes('fetch')) {
          throw err;
        }
      }
    }

    // Local registration fallback — immediate login without email verification
    const newUser: User = {
      id: `u-${Date.now()}`,
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
    };

    registeredAccounts.push({ user: newUser, password: data.password });
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

  async updateName(userId: string, newName: string): Promise<User> {
    const trimmed = newName.trim();
    if (!trimmed) {
      throw new Error('Name cannot be empty.');
    }
    if (trimmed.length < 2) {
      throw new Error('Name must be at least 2 characters.');
    }
    if (trimmed.length > 60) {
      throw new Error('Name cannot exceed 60 characters.');
    }

    let updatedUser: User | null = null;

    if (isSupabaseConfigured() && isValidUuid(userId)) {
      try {
        await supabase.auth.updateUser({
          data: { name: trimmed },
        });
      } catch {
        // Non-blocking if auth user metadata update fails
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .update({ name: trimmed })
          .eq('id', userId)
          .select()
          .maybeSingle();

        const session = this.getSession();
        if (session && profile) {
          updatedUser = {
            ...session.user,
            name: profile.name || trimmed,
          };
        }
      } catch {
        // Fallback to local session update
      }
    }

    const session = this.getSession();
    if (session) {
      updatedUser = {
        ...session.user,
        name: trimmed,
      };
      session.user = updatedUser;
      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }
    }

    const mock = mockUsers.find((u) => u.id === userId || u.email === session?.user.email);
    if (mock) {
      mock.name = trimmed;
    }

    if (!updatedUser) {
      throw new Error('No active user session found to update.');
    }

    return updatedUser;
  },
};
