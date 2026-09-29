/**
 * Supabase client — demo-first.
 *
 * The app is structured for Supabase Auth + Postgres + Storage from the
 * start, but runs in demo mode until the project URL and publishable key
 * are provided via environment variables.
 *
 * SECURITY: only the publishable (anon) key may appear here. The service-role
 * key and all other secrets stay server-side (FastAPI backend / Vercel
 * server env) and must NEVER be prefixed with NEXT_PUBLIC_.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

export function isSupabaseConfigured(): boolean {
  return Boolean(url && publishableKey);
}

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!_client) {
    _client = createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return _client;
}

/** Current access token for FastAPI Authorization header, or null in demo mode. */
export async function getAccessToken(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}
