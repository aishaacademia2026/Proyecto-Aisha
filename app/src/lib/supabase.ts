import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export type GoogleSignInStatus = "ready" | "provider-disabled" | "unreachable";

// signInWithOAuth only builds a URL and navigates, so a dead project or a disabled provider
// would otherwise leave the visitor on a browser error page. Ask the auth server first.
export async function checkGoogleSignIn(): Promise<GoogleSignInStatus> {
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: supabaseAnonKey },
    });
    if (!response.ok) return "unreachable";
    const settings = (await response.json()) as { external?: { google?: boolean } };
    return settings.external?.google ? "ready" : "provider-disabled";
  } catch {
    return "unreachable";
  }
}
