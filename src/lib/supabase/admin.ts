import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client.
 *
 * Secret key bypasses RLS so the public anon key never sees patient rows or
 * ID photos. SUPABASE_URL should be the project origin, not /rest/v1/.
 */
export function supabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SECRET_KEY?.trim(),
  );
}

/** Project origin, with a trailing slash or /rest/v1 stripped if pasted from the dashboard. */
export function supabaseUrl(): string {
  const url = process.env.SUPABASE_URL?.trim();
  if (!url) {
    throw new Error("Set SUPABASE_URL (Project URL from Settings → API).");
  }
  return url.replace(/\/$/, "").replace(/\/rest\/v1$/i, "");
}

/** Service-role (secret) key — never expose this to the browser. */
export function supabaseSecret(): string {
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("Set SUPABASE_SECRET_KEY.");
  }
  return key;
}

/** Admin client used by persist.ts and the setup script. */
export function createSupabaseAdmin(): SupabaseClient {
  return createClient(supabaseUrl(), supabaseSecret(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const GOVERNMENT_ID_BUCKET = "government_id";
export const HMO_ID_BUCKET = "hmo_id";
