import { createClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "@/lib/env";

/**
 * Service-role client for admin actions (creating accounts, setting temporary passwords). Server only: the key must never reach
 * the browser, so this module is imported only from route handlers.
 */
export function createSupabaseAdminClient() {
  if (typeof window !== "undefined") throw new Error("The Supabase admin client is server-only.");
  return createClient(publicEnv.supabaseUrl(), serverEnv.serviceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
