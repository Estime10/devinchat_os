import type { OwnFeature } from "@/backend/features/04_features/types/own-feature";
import { compareByBranchPushOrder } from "@/lib/github/branch-display-order";
import { createClient } from "@/lib/supabase/server";

/**
 * Features visibles pyramide :
 * - branche encore présente, ou
 * - status done (conservé après delete GitHub de la branche)
 * Exclut archived.
 */
export async function listOwnProjectFeatures(
  projectId: string,
): Promise<OwnFeature[] | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("features")
    .select("id, name, branch_name, parent_branch_name, status, last_pushed_at")
    .eq("project_id", projectId)
    .neq("status", "archived");

  if (error || !data) {
    return null;
  }

  return data
    .filter(
      (feature) => feature.branch_name !== null || feature.status === "done",
    )
    .map((feature) => ({
      id: feature.id,
      name: feature.name,
      branchName: feature.branch_name,
      parentBranchName: feature.parent_branch_name,
      status: feature.status,
      lastPushedAt: feature.last_pushed_at,
    }))
    .sort((a, b) =>
      compareByBranchPushOrder(
        { branchName: a.branchName, lastPushedAt: a.lastPushedAt },
        { branchName: b.branchName, lastPushedAt: b.lastPushedAt },
      ),
    );
}
