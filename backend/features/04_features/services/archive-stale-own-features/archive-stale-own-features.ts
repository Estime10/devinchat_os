import { resolveStaleFeatureUpdate } from "@/backend/features/04_features/domain/resolve-stale-feature-update/resolve-stale-feature-update";
import { createClient } from "@/lib/supabase/server/server";

/**
 * Branche disparue sur GitHub :
 * - done → conserve le status (historique arbre), branch_name = null
 * - sinon → archived
 */
export async function archiveStaleOwnFeatures(input: {
  projectId: string;
  activeBranchNames: ReadonlySet<string>;
}): Promise<boolean> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("features")
    .select("id, branch_name, status, manual_override")
    .eq("project_id", input.projectId);

  if (error || !rows) {
    return false;
  }

  for (const row of rows) {
    if (!row.branch_name || input.activeBranchNames.has(row.branch_name)) {
      continue;
    }

    const update = resolveStaleFeatureUpdate({
      status: row.status,
      manualOverride: row.manual_override === true,
    });
    if (!update) {
      continue;
    }

    const { error: updateError } = await supabase
      .from("features")
      .update(update)
      .eq("id", row.id);

    if (updateError) {
      return false;
    }
  }

  return true;
}
