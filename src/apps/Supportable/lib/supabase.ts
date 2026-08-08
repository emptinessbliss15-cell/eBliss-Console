import { createClient } from "@supabase/supabase-js";

const viteImportMeta = import.meta as ImportMeta & {
  env: {
    VITE_SUPABASE_URL?: string;
    VITE_SUPABASE_ANON_KEY?: string;
  };
};

const supabaseUrl = viteImportMeta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = viteImportMeta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Keep the Console alive while Supportable is being configured.
// The actual client is created only when both public Supabase values exist.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;
