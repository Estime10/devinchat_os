import { createClient } from "@/lib/supabase/server/server";

export type OwnProjectRow = {
  id: string;
  name: string;
  githubRepositoryId: string | null;
};

/**
 * Assure un projet 1:1 pour le miroir github_repositories (owner = user).
 */
export async function ensureOwnProjectForRepository(input: {
  userId: string;
  githubRepositoryId: string;
  projectName: string;
}): Promise<OwnProjectRow | null> {
  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("projects")
    .select("id, name, github_repository_id")
    .eq("github_repository_id", input.githubRepositoryId)
    .eq("owner_id", input.userId)
    .maybeSingle();

  if (existingError) {
    return null;
  }

  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      githubRepositoryId: existing.github_repository_id,
    };
  }

  const { data: created, error: createError } = await supabase
    .from("projects")
    .insert({
      owner_id: input.userId,
      name: input.projectName,
      github_repository_id: input.githubRepositoryId,
      status: "active",
    })
    .select("id, name, github_repository_id")
    .single();

  if (createError || !created) {
    return null;
  }

  return {
    id: created.id,
    name: created.name,
    githubRepositoryId: created.github_repository_id,
  };
}
