import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

export type OwnGithubConnection = {
  id: string;
  githubLogin: string;
  status: "active" | "expired" | "revoked" | "error";
  scopes: string[] | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Connexion GitHub du user — sans credentials.
 * `cache()` déduplique layout + screen dans la même requête.
 */
export const getOwnGithubConnection = cache(
  async (): Promise<OwnGithubConnection | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from("github_connections")
      .select("id, github_login, status, scopes, created_at, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      githubLogin: data.github_login,
      status: data.status,
      scopes: data.scopes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
);
