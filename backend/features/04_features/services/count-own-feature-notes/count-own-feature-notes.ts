import { createClient } from "@/lib/supabase/server/server";

/**
 * Compte les notes par feature (owner only via RLS) — lecture légère pour badges.
 */
export async function countOwnFeatureNotes(
  featureIds: readonly string[],
): Promise<Record<string, number>> {
  if (featureIds.length === 0) {
    return {};
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feature_notes")
    .select("feature_id")
    .in("feature_id", [...featureIds]);

  if (error || !data) {
    return {};
  }

  const counts: Record<string, number> = {};
  for (const row of data) {
    const featureId = row.feature_id;
    if (typeof featureId !== "string" || featureId.length === 0) {
      continue;
    }
    counts[featureId] = (counts[featureId] ?? 0) + 1;
  }
  return counts;
}
