import { createClient as createSupabaseClient } from '@supabase/supabase-js'

let _client: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  // Always return the same instance in the browser
  if (typeof window !== 'undefined' && _client) {
    return _client;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !anon) {
    throw new Error('Missing Supabase environment variables');
  }

  const client = createSupabaseClient(url, anon, {
    auth: {
      persistSession: true,       // keep session in localStorage
      autoRefreshToken: true,     // refresh tokens automatically
      detectSessionInUrl: true,   // handle OAuth redirects
    },
    global: {
      headers: {
        'X-Client-Info': 'doxa-threads-visitor-tracker'
      }
    },
    db: {
      schema: 'public'
    }
  });

  // Only cache in browser
  if (typeof window !== 'undefined') {
    _client = client;
  }

  return client;
}
