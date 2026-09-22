import {
  parseNoteAttachments,
  type NoteAttachment,
} from "@/backend/features/04_features/domain/note-attachment/note-attachment";
import { parseNoteDocument } from "@/backend/features/04_features/domain/note-document/note-document";
import type { OwnFeatureNote } from "@/backend/features/04_features/types/own-feature-note/own-feature-note";
import { signOwnFeatureNoteAttachmentUrls } from "@/backend/features/04_features/services/upload-own-feature-note-attachment/upload-own-feature-note-attachment";
import { createClient } from "@/lib/supabase/server/server";

/**
 * Liste les notes d’une feature (owner only via RLS).
 * URLs attachments = signées (bucket privé).
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
    const stored: NoteAttachment[] = parseNoteAttachments(row.attachments);
    const attachments = await signOwnFeatureNoteAttachmentUrls(stored);
    notes.push({
      id: row.id,
      featureId: row.feature_id,
      title: row.title,
      blocks,
      attachments,
      updatedAt: row.updated_at,
    });
  }

  return notes;
}
