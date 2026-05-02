import { createServerClient, type CookieOptionsWithName } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export function createSupabaseServerClient(cookies: AstroCookies) {
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (key) => cookies.get(key)?.value,
        set: (key, value, options: CookieOptionsWithName) =>
          cookies.set(key, value, { ...options, path: '/' }),
        remove: (key, options) => cookies.delete(key, { ...options, path: '/' }),
      },
    }
  );
}
