import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminEnv } from "@/lib/supabase/env/env";

/**
 * Client Supabase service_role — server-only.
 * Usage minimal : RPCs credentials (get/upsert) après vérification de session.
 * Ne jamais importer depuis un Client Component.
 */
export function createAdminClient() {
  const env = getSupabaseAdminEnv();
  if (!env) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY (server-only — Supabase Dashboard → Settings → API)",
    );
  }

  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
