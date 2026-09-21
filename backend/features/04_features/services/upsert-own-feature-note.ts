import {
  noteAttachmentsSchema,
  type NoteAttachment,
} from "@/backend/features/04_features/domain/note-attachment";
import type { NoteBlock } from "@/backend/features/04_features/domain/note-block";
import {
  deriveNoteTitle,
  noteDocumentSchema,
} from "@/backend/features/04_features/domain/note-document";
import type { OwnFeatureNote } from "@/backend/features/04_features/types/own-feature-note";
import { createClient } from "@/lib/supabase/server";

export type UpsertOwnFeatureNoteInput = {
  featureId: string;
  noteId?: string | null;
  blocks: NoteBlock[];
  attachments?: NoteAttachment[];
};

/**
 * Crée ou met à jour une note (RLS owner).
 */
export async function upsertOwnFeatureNote(
  input: UpsertOwnFeatureNoteInput,
): Promise<OwnFeatureNote | null> {
  const parsed = noteDocumentSchema.safeParse(input.blocks);
  if (!parsed.success) {
    return null;
  }

  const attachmentsResult = noteAttachmentsSchema.safeParse(
    input.attachments ?? [],
  );
  if (!attachmentsResult.success) {
    return null;
  }

  const title = deriveNoteTitle(parsed.data);
  const attachments = attachmentsResult.data;
  const supabase = await createClient();

  if (input.noteId) {
    const { data, error } = await supabase
      .from("feature_notes")
      .update({
        title,
        body: parsed.data,
        attachments,
      })
      .eq("id", input.noteId)
      .eq("feature_id", input.featureId)
      .select("id, feature_id, title, body, attachments, updated_at")
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      featureId: data.feature_id,
      title: data.title,
      blocks: parsed.data,
      attachments,
      updatedAt: data.updated_at,
    };
  }

  const { data, error } = await supabase
    .from("feature_notes")
    .insert({
      feature_id: input.featureId,
      title,
      body: parsed.data,
      attachments,
    })
    .select("id, feature_id, title, body, attachments, updated_at")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    featureId: data.feature_id,
    title: data.title,
    blocks: parsed.data,
    attachments,
    updatedAt: data.updated_at,
  };
}
