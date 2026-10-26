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

export const supabaseConfigured = Boolean(url && key);

export const supabase = createClient(url || "http://localhost:54321", key || "not-configured", {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const PHOTO_BUCKET = "listing-photos";
