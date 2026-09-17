import { createClient } from "@supabase/supabase-js";

const env = import.meta.env || {};

export const supabaseUrl = String(env.VITE_SUPABASE_URL || "").trim();
export const supabasePublishableKey = String(env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();
export const supabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

let client = null;

export function getSupabase() {
  if (!supabaseConfigured) return null;
  if (!client) {
    client = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

