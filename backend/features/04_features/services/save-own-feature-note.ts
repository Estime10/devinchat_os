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
import {
  removeOwnFeatureNoteAttachmentFiles,
  uploadOwnFeatureNoteAttachment,
} from "@/backend/features/04_features/services/upload-own-feature-note-attachment";
import { createClient } from "@/lib/supabase/server";

export type SaveOwnFeatureNoteInput = {
  featureId: string;
  noteId?: string | null;
  blocks: NoteBlock[];
  /** Attachments déjà en storage à conserver. */
  retainedAttachments: NoteAttachment[];
  /** Nouveaux fichiers — uploadés seulement après création/MAJ de la note. */
  newFiles: ReadonlyArray<{ id: string; file: File; label: string }>;
};

function toOwnFeatureNote(
  row: {
    id: string;
    feature_id: string;
    title: string;
    updated_at: string;
  },
  blocks: NoteBlock[],
  attachments: NoteAttachment[],
): OwnFeatureNote {
  return {
    id: row.id,
    featureId: row.feature_id,
    title: row.title,
    blocks,
    attachments,
    updatedAt: row.updated_at,
  };
}

/**
 * Persiste une note : DB d’abord, puis upload images, puis MAJ attachments.
 * Rien n’est écrit tant que cette fonction n’est pas appelée.
 */
export async function saveOwnFeatureNote(
  input: SaveOwnFeatureNoteInput,
): Promise<OwnFeatureNote | null> {
  const parsed = noteDocumentSchema.safeParse(input.blocks);
  if (!parsed.success) {
    return null;
  }

  const retainedResult = noteAttachmentsSchema.safeParse(
    input.retainedAttachments,
  );
  if (!retainedResult.success) {
    return null;
  }

  const title = deriveNoteTitle(parsed.data);
  const retained = retainedResult.data.map((item, index) => ({
    id: item.id,
    path: item.path,
    url: item.url,
    name: item.name,
    mimeType: item.mimeType,
    size: item.size,
    label: item.label ?? `image${index + 1}`,
  }));
  const supabase = await createClient();

  let noteId = input.noteId ?? null;
  let row: {
    id: string;
    feature_id: string;
    title: string;
    updated_at: string;
  } | null = null;

  if (noteId) {
    const { data, error } = await supabase
      .from("feature_notes")
      .update({
        title,
        body: parsed.data,
        attachments: retained,
      })
      .eq("id", noteId)
      .eq("feature_id", input.featureId)
      .select("id, feature_id, title, updated_at")
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    row = data;
  } else {
    const { data, error } = await supabase
      .from("feature_notes")
      .insert({
        feature_id: input.featureId,
        title,
        body: parsed.data,
        attachments: retained,
      })
      .select("id, feature_id, title, updated_at")
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    noteId = data.id;
    row = data;
  }

  if (!noteId || !row) {
    return null;
  }

  const uploaded: NoteAttachment[] = [];
  const isCreate = !input.noteId;

  for (const item of input.newFiles) {
    const attachment = await uploadOwnFeatureNoteAttachment({
      featureId: input.featureId,
      noteId,
      file: item.file,
      attachmentId: item.id,
      label: item.label,
    });
    if (!attachment) {
      await removeOwnFeatureNoteAttachmentFiles(
        uploaded.map((file) => file.path),
      );
      if (isCreate) {
        await supabase
          .from("feature_notes")
          .delete()
          .eq("id", noteId)
          .eq("feature_id", input.featureId);
      }
      return null;
    }
    uploaded.push(attachment);
  }

  const attachments = [...retained, ...uploaded];

  if (uploaded.length > 0) {
    const { data, error } = await supabase
      .from("feature_notes")
      .update({ attachments })
      .eq("id", noteId)
      .eq("feature_id", input.featureId)
      .select("id, feature_id, title, updated_at")
      .maybeSingle();

    if (error || !data) {
      await removeOwnFeatureNoteAttachmentFiles(
        uploaded.map((file) => file.path),
      );
      if (isCreate) {
        await supabase
          .from("feature_notes")
          .delete()
          .eq("id", noteId)
          .eq("feature_id", input.featureId);
      }
      return null;
    }
    row = data;
  }

  return toOwnFeatureNote(row, parsed.data, attachments);
}
