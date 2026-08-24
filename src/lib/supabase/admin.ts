import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Secret key is server-only. It bypasses RLS so bookings and ID photos stay
 * off the public API.
 */
export function supabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SECRET_KEY?.trim(),
  );
}

export function supabaseUrl(): string {
  const url = process.env.SUPABASE_URL?.trim();
  if (!url) {
    throw new Error("Set SUPABASE_URL (Project URL from Settings → API).");
  }
  return url.replace(/\/$/, "").replace(/\/rest\/v1$/i, "");
}

export function supabaseSecret(): string {
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("Set SUPABASE_SECRET_KEY.");
  }
  return key;
}

export function createSupabaseAdmin(): SupabaseClient {
  return createClient(supabaseUrl(), supabaseSecret(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const GOVERNMENT_ID_BUCKET = "government_id";
export const HMO_ID_BUCKET = "hmo_id";
