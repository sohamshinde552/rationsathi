import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from Next.js / standard Node environment variables.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://example.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'missing-anon-key';

const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = Boolean(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
);
export const hasSupabaseServiceRole = Boolean(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) && supabaseServiceRoleKey
);

/**
 * Singleton Supabase Client initialized for client-side and server-side execution.
 * Configured with automatic token refresh and session persistence.
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: typeof window !== 'undefined',
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Server-only Supabase client. A service-role key bypasses RLS so the Express
 * gateway can write verified ledger rows after applying its own validation.
 */
export const supabaseAdmin: SupabaseClient | null = hasSupabaseServiceRole
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

export function createSupabaseClientForJwt(jwt?: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: jwt
      ? {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      : undefined,
  });
}

export default supabase;
