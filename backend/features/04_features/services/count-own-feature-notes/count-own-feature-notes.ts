import { createClient } from "@/lib/supabase/server/server";
import { z } from "zod";

const rowSchema = z.object({
  feature_id: z.string().uuid(),
  note_count: z.coerce.number().int().nonnegative(),
});

/**
 * Compte les notes par feature via RPC agrégat (owner only via RLS INVOKER).
 * Évite SELECT de toutes les rows (plafond PostgREST ~1000).
 */
export async function countOwnFeatureNotes(
  featureIds: readonly string[],
): Promise<Record<string, number>> {
  if (featureIds.length === 0) {
    return {};
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("count_own_feature_notes", {
    p_feature_ids: [...featureIds],
  });

  if (error || !data) {
    return {};
  }

  const counts: Record<string, number> = {};
  for (const raw of data) {
    const parsed = rowSchema.safeParse(raw);
    if (!parsed.success) {
      continue;
    }
    counts[parsed.data.feature_id] = parsed.data.note_count;
  }
  return counts;
}
