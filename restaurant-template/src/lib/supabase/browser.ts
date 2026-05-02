import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabaseBrowser = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
