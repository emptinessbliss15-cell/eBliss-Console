import { createClient } from "@supabase/supabase-js";

const viteImportMeta = import.meta as ImportMeta & {
  env: {
    VITE_SUPABASE_URL?: string;
    VITE_SUPABASE_ANON_KEY?: string;
  };
};

const supabaseUrl = viteImportMeta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = viteImportMeta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
