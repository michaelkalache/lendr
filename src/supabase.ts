import { createClient } from "@supabase/supabase-js";

/*
 * Supabase project connection.
 * The publishable key is designed to be public (it ships to every browser); what each person
 * can read or change is enforced by the Row Level Security rules in supabase/schema.sql.
 * VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY environment variables override these.
 */
const SUPABASE_URL = "https://mjqappnkbgdihukjcjez.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_klRZg5I3Kb4OwjBG1inwgQ_y3DeWpes";

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || SUPABASE_URL;
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) || SUPABASE_PUBLISHABLE_KEY;

/*
 * What a link from a Supabase email brought back, read before the client tidies up the URL:
 * a confirmed sign-up, or an error such as an expired link.
 */
export type AuthLinkResult = { confirmed: true } | { error: string; description: string } | null;
export const authLinkResult: AuthLinkResult = (() => {
  if (typeof window === "undefined" || !window.location.hash) return null;
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const error = hash.get("error_code") || hash.get("error");
  if (error) {
    // The client leaves error fragments in place; clear it so a refresh doesn't show it again.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    return { error, description: hash.get("error_description") ?? "" };
  }
  if (hash.get("access_token") && ["signup", "email"].includes(hash.get("type") ?? "")) return { confirmed: true };
  return null;
})();

export const supabaseConfigured = Boolean(url && key);

export const supabase = createClient(url || "http://localhost:54321", key || "not-configured", {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const PHOTO_BUCKET = "listing-photos";
