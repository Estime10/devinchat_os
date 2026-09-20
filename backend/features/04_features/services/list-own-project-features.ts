import type { OwnFeature } from "@/backend/features/04_features/types/own-feature";
import { compareByBranchPushOrder } from "@/lib/github/branch-display-order";
import { createClient } from "@/lib/supabase/server";

/**
 * Features actives d’un projet (avec parent pour l’arbre).
 */
export async function listOwnProjectFeatures(
  projectId: string,
): Promise<OwnFeature[] | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("features")
    .select("id, name, branch_name, parent_branch_name, status, last_pushed_at")
    .eq("project_id", projectId)
    .not("branch_name", "is", null);

  if (error || !data) {
    return null;
  }

  return data
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
