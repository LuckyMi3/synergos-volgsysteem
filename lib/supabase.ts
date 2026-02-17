import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ✅ Tijdens ontwikkeling/Neon-fase willen we NIET crashen als Supabase niet is ingesteld.
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
