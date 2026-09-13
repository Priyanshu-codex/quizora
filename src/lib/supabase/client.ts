import { createBrowserClient } from '@supabase/ssr';

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return false;
  if (url.includes('your-project') || url.includes('placeholder')) return false;
  if (anonKey.includes('your-anon-key') || anonKey.includes('placeholder')) return false;

  return true;
}

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

  browserClient = createBrowserClient(url, anonKey, {
    cookies: {
      getAll() {
        if (typeof document === 'undefined') return [];
        return document.cookie ? document.cookie.split('; ').filter(Boolean).map((c) => {
          const [name, ...val] = c.split('=');
          return { name, value: val.join('=') };
        }) : [];
      },
      setAll(cookiesToSet) {
        if (typeof document === 'undefined') return;
        cookiesToSet.forEach(({ name, value, options }) => {
          document.cookie = `${name}=${value}; path=${options?.path ?? '/'}`;
        });
      },
    },
  });
  return browserClient;
}

export const supabase = getSupabaseBrowserClient();
