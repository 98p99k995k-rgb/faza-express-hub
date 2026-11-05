import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabaseFunctionConfig() {
  if (typeof window === "undefined") return null;
  const url = import.meta.env["VITE_SUPABASE_URL"];
  const anonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"];
  return url && anonKey ? { url, anonKey } : null;
}

export function getSupabaseClient() {
  if (typeof window === "undefined") return null;
  const config = getSupabaseFunctionConfig();
  if (!config) return null;

  client ??= createClient(config.url, config.anonKey, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
  });
  return client;
}

export function getMoyasarPublishableKey() {
  return import.meta.env["VITE_MOYASAR_PUBLISHABLE_KEY"] ?? "";
}
