
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

let _client: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  _client = createSupabaseClient(url, anon, {
    auth: {
      persistSession: true,       // keep session in localStorage
      autoRefreshToken: true,     // refresh tokens automatically
      detectSessionInUrl: true,   // handle OAuth redirects
    },
    global: {
      // optional: include credentials on same-origin if you also do cookie-based auth elsewhere
      // fetch: (input, init) => fetch(input, { ...init, credentials: 'same-origin' }),
    }
  });

  return _client;
}
