import { featureNameFromBranch } from "@/lib/github/feature-branch";
import { createClient } from "@/lib/supabase/server";

/**
 * Insert ou update une feature liée à une branche Git.
 */
export async function upsertOwnFeatureBranch(input: {
  projectId: string;
  branchName: string;
  status: "in_progress" | "done";
  lastPushedAt: string | null;
  parentBranchName: string | null;
}): Promise<boolean> {
  const supabase = await createClient();
  const name = featureNameFromBranch(input.branchName);
  const payload = {
    name,
    status: input.status,
    last_pushed_at: input.lastPushedAt,
    parent_branch_name: input.parentBranchName,
  };

  const { data: existing } = await supabase
    .from("features")
    .select("id, manual_override")
    .eq("project_id", input.projectId)
    .eq("branch_name", input.branchName)
    .maybeSingle();

  if (existing) {
    if (!existing.manual_override) {
      const { error } = await supabase
        .from("features")
        .update(payload)
        .eq("id", existing.id);
      return !error;
    }

    const { error } = await supabase
      .from("features")
      .update({
        last_pushed_at: input.lastPushedAt,
        parent_branch_name: input.parentBranchName,
      })
      .eq("id", existing.id);
    return !error;
  }

  const { error } = await supabase.from("features").insert({
    project_id: input.projectId,
    name,
    branch_name: input.branchName,
    status: input.status,
    last_pushed_at: input.lastPushedAt,
    parent_branch_name: input.parentBranchName,
  });

  return !error;
}
