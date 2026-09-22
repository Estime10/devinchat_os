import { createClient } from "@/lib/supabase/server/server";
import type { GithubRepo } from "@/lib/github/repos/repos";

export type OwnGithubRepositoryRow = {
  id: string;
  connectionId: string;
  githubRepositoryId: number;
  owner: string;
  name: string;
  fullName: string;
};

/**
 * Upsert miroir github_repositories pour la connexion du user.
 */
export async function upsertOwnGithubRepository(input: {
  connectionId: string;
  owner: string;
  repo: GithubRepo;
}): Promise<OwnGithubRepositoryRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("github_repositories")
    .upsert(
      {
        connection_id: input.connectionId,
        github_repository_id: input.repo.id,
        owner: input.owner,
        name: input.repo.name,
        full_name: input.repo.fullName,
        default_branch: input.repo.defaultBranch,
        is_private: input.repo.isPrivate,
        html_url: input.repo.htmlUrl,
      },
      { onConflict: "connection_id,github_repository_id" },
    )
    .select("id, connection_id, github_repository_id, owner, name, full_name")
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    connectionId: data.connection_id,
    githubRepositoryId: data.github_repository_id,
    owner: data.owner,
    name: data.name,
    fullName: data.full_name,
  };
}
