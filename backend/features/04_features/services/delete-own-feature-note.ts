import { parseNoteAttachments } from "@/backend/features/04_features/domain/note-attachment";
import { removeOwnFeatureNoteAttachmentFiles } from "@/backend/features/04_features/services/upload-own-feature-note-attachment";
import { createClient } from "@/lib/supabase/server";

/**
 * Supprime une note + fichiers storage associés (RLS owner).
 */
export async function deleteOwnFeatureNote(input: {
  featureId: string;
  noteId: string;
}): Promise<boolean> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("feature_notes")
    .select("attachments")
    .eq("id", input.noteId)
    .eq("feature_id", input.featureId)
    .maybeSingle();

  const attachments = parseNoteAttachments(existing?.attachments);
  const paths = attachments.map((item) => item.path);

  const { error, count } = await supabase
    .from("feature_notes")
    .delete({ count: "exact" })
    .eq("id", input.noteId)
    .eq("feature_id", input.featureId);

  if (error || (count ?? 0) === 0) {
    return false;
  }

  await removeOwnFeatureNoteAttachmentFiles(paths);
  return true;
}
