import { SupabaseClient } from '@supabase/supabase-js';
export declare const isSupabaseConfigured: boolean;
export declare const hasSupabaseServiceRole: boolean;
/**
 * Singleton Supabase Client initialized for client-side and server-side execution.
 * Configured with automatic token refresh and session persistence.
 */
export declare const supabase: SupabaseClient;
/**
 * Server-only Supabase client. A service-role key bypasses RLS so the Express
 * gateway can write verified ledger rows after applying its own validation.
 */
export declare const supabaseAdmin: SupabaseClient | null;
export declare function createSupabaseClientForJwt(jwt?: string): SupabaseClient;
export default supabase;
