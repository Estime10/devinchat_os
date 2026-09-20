import { createClient } from "@/lib/supabase/server";

/**
 * Archive les features dont la branche a disparu sur GitHub.
 */
export async function archiveStaleOwnFeatures(input: {
  projectId: string;
  activeBranchNames: ReadonlySet<string>;
}): Promise<boolean> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("features")
    .select("id, branch_name, manual_override")
    .eq("project_id", input.projectId);

  if (error || !rows) {
    return false;
  }

  for (const row of rows) {
    if (!row.branch_name || input.activeBranchNames.has(row.branch_name)) {
      continue;
    }
    if (row.manual_override) {
      continue;
    }

    const { error: updateError } = await supabase
      .from("features")
      .update({ branch_name: null, status: "archived" })
      .eq("id", row.id);

    if (updateError) {
      return false;
    }
  }

  return true;
}
