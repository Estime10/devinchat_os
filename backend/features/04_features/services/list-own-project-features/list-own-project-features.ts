import type { OwnFeature } from "@/backend/features/04_features/types/own-feature/own-feature";
import { compareByBranchPushOrder } from "@/backend/features/04_features/domain/branch-display-order/branch-display-order";
import { isMergedFeatureStatus } from "@/backend/features/04_features/domain/resolve-branch-feature-status/resolve-branch-feature-status";
import { createClient } from "@/lib/supabase/server/server";

/**
 * Features visibles arbre :
 * - branche encore présente, ou
 * - status merged (legacy done — conservé après delete GitHub de la branche)
 * Exclut archived.
 */
export async function listOwnProjectFeatures(
  projectId: string,
): Promise<OwnFeature[] | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("features")
    .select(
      "id, name, branch_name, parent_branch_name, status, last_pushed_at, tip_commit_sha",
    )
    .eq("project_id", projectId)
    .neq("status", "archived");

  if (error || !data) {
    return null;
  }

  return data
    .filter(
      (feature) =>
        feature.branch_name !== null || isMergedFeatureStatus(feature.status),
    )
    .map((feature) => ({
      id: feature.id,
      name: feature.name,
      branchName: feature.branch_name,
      parentBranchName: feature.parent_branch_name,
      status: feature.status,
      lastPushedAt: feature.last_pushed_at,
      tipCommitSha: feature.tip_commit_sha,
    }))
    .sort((a, b) =>
      compareByBranchPushOrder(
        { branchName: a.branchName, lastPushedAt: a.lastPushedAt },
        { branchName: b.branchName, lastPushedAt: b.lastPushedAt },
      ),
    );
}
