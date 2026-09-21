import { isGithubConnectionActive } from "@/backend/features/02_github/domain/is-github-connection-active";
import { getOwnGithubAccessToken } from "@/backend/features/02_github/services/get-own-github-access-token";
import { getOwnGithubConnection } from "@/backend/features/02_github/services/get-own-github-connection";
import { getOwnGithubRepo } from "@/backend/features/02_github/services/get-own-github-repo";
import { markOwnGithubConnectionExpired } from "@/backend/features/02_github/services/mark-own-github-connection-expired";
import { githubReposCacheTag } from "@/backend/features/02_github/services/list-own-github-repos";
import { upsertOwnGithubRepository } from "@/backend/features/02_github/services/upsert-own-github-repository";
import { ensureOwnProjectForRepository } from "@/backend/features/03_projects/services/ensure-own-project-for-repository";
import {
  applyFeatureBranchSyncPlan,
  buildFeatureBranchSyncPlan,
} from "@/backend/features/04_features/services/sync-own-project-features";
import type { OwnFeature } from "@/backend/features/04_features/types/own-feature";
import { parseGithubFullName } from "@/lib/github/commit-activity";
import { isGithubUnauthorizedError } from "@/lib/github/github-unauthorized-error";
import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

/** TTL snapshot GitHub — évite re-fetch merge matrix à chaque ouverture. */
export const REPOSITORY_FEATURES_CACHE_SECONDS = 60;

export function repositoryFeaturesCacheTag(
  userId: string,
  owner: string,
  repo: string,
): string {
  return `repo-features:${userId}:${owner}/${repo}`;
}

export type OwnRepositoryFeaturesResult =
  | { kind: "ok"; features: OwnFeature[] }
  | { kind: "unauthorized" }
  | { kind: "error" };

/**
 * Use-case portfolio — miroir repo/projet + sync.
 * Cache = snapshot GitHub uniquement (pas de cookies dans unstable_cache).
 */
export async function loadOwnRepositoryFeatures(
  owner: string,
  repo: string,
): Promise<OwnRepositoryFeaturesResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { kind: "error" };
  }

  const connection = await getOwnGithubConnection();
  if (!isGithubConnectionActive(connection) || !connection) {
    return { kind: "unauthorized" };
  }

  const accessToken = await getOwnGithubAccessToken();
  if (!accessToken) {
    return { kind: "unauthorized" };
  }

  const githubRepoResult = await getOwnGithubRepo(owner, repo);
  if (githubRepoResult.kind === "unauthorized") {
    return { kind: "unauthorized" };
  }
  if (githubRepoResult.kind !== "ok") {
    return { kind: "error" };
  }

  const githubRepo = githubRepoResult.repo;
  const parsed = parseGithubFullName(githubRepo.fullName);
  if (!parsed) {
    return { kind: "error" };
  }

  const repositoryRow = await upsertOwnGithubRepository({
    connectionId: connection.id,
    owner: parsed.owner,
    repo: githubRepo,
  });
  if (!repositoryRow) {
    return { kind: "error" };
  }

  const project = await ensureOwnProjectForRepository({
    userId: user.id,
    githubRepositoryId: repositoryRow.id,
    projectName: githubRepo.name,
  });
  if (!project) {
    return { kind: "error" };
  }

  const loadPlan = unstable_cache(
    async () =>
      buildFeatureBranchSyncPlan({
        accessToken,
        owner: parsed.owner,
        repo: parsed.repo,
      }),
    ["own-repository-feature-plan", user.id, parsed.owner, parsed.repo],
    {
      revalidate: REPOSITORY_FEATURES_CACHE_SECONDS,
      tags: [
        githubReposCacheTag(user.id),
        repositoryFeaturesCacheTag(user.id, parsed.owner, parsed.repo),
      ],
    },
  );

  try {
    const plan = await loadPlan();
    if (!plan) {
      return { kind: "error" };
    }

    const features = await applyFeatureBranchSyncPlan({
      projectId: project.id,
      plan,
    });
    if (!features) {
      return { kind: "error" };
    }
    return { kind: "ok", features };
  } catch (error) {
    if (isGithubUnauthorizedError(error)) {
      await markOwnGithubConnectionExpired();
      return { kind: "unauthorized" };
    }
    return { kind: "error" };
  }
}
