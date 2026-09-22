import { createClient } from "@/lib/supabase/server/server";

export type OwnProfile = {
  id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Profil du user authentifié uniquement (id = auth.uid()).
 * Ne jamais accepter un userId externe.
 */
export async function getOwnProfile(): Promise<OwnProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}
