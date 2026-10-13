import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** Cliente anónimo sin cookies: para datos públicos cacheables (catálogo, ajustes, FAQ). */
export function createPublicClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
