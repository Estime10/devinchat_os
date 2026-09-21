import { parseNoteAttachments } from "@/backend/features/04_features/domain/note-attachment";
import { parseNoteDocument } from "@/backend/features/04_features/domain/note-document";
import type { OwnFeatureNote } from "@/backend/features/04_features/types/own-feature-note";
import { createClient } from "@/lib/supabase/server";

/**
 * Liste les notes d’une feature (owner only via RLS).
 */
export async function listOwnFeatureNotes(
  featureId: string,
): Promise<OwnFeatureNote[] | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("feature_notes")
    .select("id, feature_id, title, body, attachments, updated_at")
    .eq("feature_id", featureId)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return null;
  }

  const notes: OwnFeatureNote[] = [];
  for (const row of data) {
    const blocks = parseNoteDocument(row.body);
    if (!blocks) {
      continue;
    }
    notes.push({
      id: row.id,
      featureId: row.feature_id,
      title: row.title,
      blocks,
      attachments: parseNoteAttachments(row.attachments),
      updatedAt: row.updated_at,
    });
  }

  return notes;
}
