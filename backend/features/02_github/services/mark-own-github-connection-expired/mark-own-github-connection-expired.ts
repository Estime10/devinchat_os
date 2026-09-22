import { createClient } from "@/lib/supabase/server/server";

/**
 * Token GitHub mort (401) → status expired.
 * Pas de revalidateTag ici : interdit pendant le render RSC.
 * Invalidation cache au reconnect (callback OAuth).
 */
export async function markOwnGithubConnectionExpired(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { error } = await supabase
    .from("github_connections")
    .update({ status: "expired" })
    .eq("user_id", user.id);

  return !error;
}
