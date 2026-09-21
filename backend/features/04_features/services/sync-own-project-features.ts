import { archiveStaleOwnFeatures } from "@/backend/features/04_features/services/archive-stale-own-features";
import { listOwnProjectFeatures } from "@/backend/features/04_features/services/list-own-project-features";
import { upsertOwnFeatureBranch } from "@/backend/features/04_features/services/upsert-own-feature-branch";
import type { OwnFeature } from "@/backend/features/04_features/types/own-feature";
import { getOwnGithubAccessToken } from "@/backend/features/02_github/services/get-own-github-access-token";
import { buildBranchParentMap } from "@/backend/features/04_features/domain/build-branch-parent-map";
import { fetchGithubBranches } from "@/lib/github/branches";
import {
  fetchBranchMergeMatrix,
  mergeMatrixLookup,
} from "@/lib/github/fetch-branch-merge-matrix";
import { fetchMergedPullParents } from "@/lib/github/fetch-merged-pull-parents";
import {
  INTEGRATION_BRANCH,
  isIntegrationBranch,
  isProductionBranch,
  pickProductionBranch,
  resolveBranchFeatureStatus,
} from "@/backend/features/04_features/domain/resolve-branch-feature-status";

export type FeatureBranchSyncItem = {
  branchName: string;
  status: "in_progress" | "done";
  lastPushedAt: string | null;
  parentBranchName: string | null;
};

export type FeatureBranchSyncPlan = {
  items: FeatureBranchSyncItem[];
  activeBranchNames: string[];
};

/**
 * Snapshot GitHub pur (pas de cookies / Supabase) — cacheable via unstable_cache.
 */
export async function buildFeatureBranchSyncPlan(input: {
  accessToken: string;
  owner: string;
  repo: string;
}): Promise<FeatureBranchSyncPlan | null> {
  const branches = await fetchGithubBranches(
    input.accessToken,
    input.owner,
    input.repo,
  );
  const branchNames = branches.map((branch) => branch.name);
  const activeBranchNames = branchNames;
  const activeSet = new Set(branchNames);
  const hasDevelop = activeSet.has(INTEGRATION_BRANCH);
  const productionBranch = pickProductionBranch(activeSet);

  const matrix = await fetchBranchMergeMatrix({
    accessToken: input.accessToken,
    owner: input.owner,
    repo: input.repo,
    branchNames,
  });
  const isMergedInto = mergeMatrixLookup(matrix);
  const pullParentByHead = await fetchMergedPullParents({
    accessToken: input.accessToken,
    owner: input.owner,
    repo: input.repo,
  });
  const parents = buildBranchParentMap({
    branchNames,
    isMergedInto,
    pullParentByHead,
  });

  const developMergedIntoProduction =
    hasDevelop && productionBranch
      ? isMergedInto(productionBranch, INTEGRATION_BRANCH)
      : null;

  const items: FeatureBranchSyncItem[] = [];

  for (const branch of branches) {
    const isOtherBranch =
      !isIntegrationBranch(branch.name) && !isProductionBranch(branch.name);

    const mergedIntoDevelop =
      hasDevelop && isOtherBranch
        ? isMergedInto(INTEGRATION_BRANCH, branch.name)
        : null;

    const mergedIntoProduction =
      productionBranch && isOtherBranch
        ? isMergedInto(productionBranch, branch.name)
        : null;

    const status = resolveBranchFeatureStatus({
      branchName: branch.name,
      mergedIntoDevelop,
      mergedIntoProduction,
      developMergedIntoProduction,
    });

    items.push({
      branchName: branch.name,
      status,
      lastPushedAt: branch.lastPushedAt,
      parentBranchName: parents.get(branch.name) ?? null,
    });
  }

  return { items, activeBranchNames };
}

/**
 * Persiste un plan en DB (cookies OK — hors unstable_cache).
 */
export async function applyFeatureBranchSyncPlan(input: {
  projectId: string;
  plan: FeatureBranchSyncPlan;
}): Promise<OwnFeature[] | null> {
  for (const item of input.plan.items) {
    const ok = await upsertOwnFeatureBranch({
      projectId: input.projectId,
      branchName: item.branchName,
      status: item.status,
      lastPushedAt: item.lastPushedAt,
      parentBranchName: item.parentBranchName,
    });
    if (!ok) {
      return null;
    }
  }

  const archived = await archiveStaleOwnFeatures({
    projectId: input.projectId,
    activeBranchNames: new Set(input.plan.activeBranchNames),
  });
  if (!archived) {
    return null;
  }

  return listOwnProjectFeatures(input.projectId);
}

/**
 * Sync branches → features (statut + branche de merge pour pyramide).
 */
export async function syncOwnProjectFeatures(input: {
  projectId: string;
  owner: string;
  repo: string;
  accessToken?: string;
}): Promise<OwnFeature[] | null> {
  const accessToken = input.accessToken ?? (await getOwnGithubAccessToken());
  if (!accessToken) {
    return null;
  }

  const plan = await buildFeatureBranchSyncPlan({
    accessToken,
    owner: input.owner,
    repo: input.repo,
  });
  if (!plan) {
    return null;
  }

  return applyFeatureBranchSyncPlan({
    projectId: input.projectId,
    plan,
  });
}
