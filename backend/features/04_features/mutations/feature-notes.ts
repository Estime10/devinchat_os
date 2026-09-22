"use server";

import type { NoteAttachment } from "@/backend/features/04_features/domain/note-attachment/note-attachment";
import type { NoteBlock } from "@/backend/features/04_features/domain/note-block/note-block";
import type { OwnFeatureNote } from "@/backend/features/04_features/types/own-feature-note/own-feature-note";
import { deleteOwnFeatureNote } from "@/backend/features/04_features/services/delete-own-feature-note/delete-own-feature-note";
import { listOwnFeatureNotes } from "@/backend/features/04_features/services/list-own-feature-notes/list-own-feature-notes";
import { saveOwnFeatureNote } from "@/backend/features/04_features/services/save-own-feature-note/save-own-feature-note";

export async function listOwnFeatureNotesAction(
  featureId: string,
): Promise<OwnFeatureNote[] | null> {
  return listOwnFeatureNotes(featureId);
}

export async function saveOwnFeatureNoteAction(input: {
  featureId: string;
  noteId?: string | null;
  blocks: NoteBlock[];
  retainedAttachments: NoteAttachment[];
  formData: FormData;
}): Promise<OwnFeatureNote | null> {
  const newFiles: { id: string; file: File; label: string }[] = [];
  for (const [key, value] of input.formData.entries()) {
    if (!(value instanceof File) || value.size <= 0) {
      continue;
    }
    if (key.startsWith("label:")) {
      continue;
    }
    const labelValue = input.formData.get(`label:${key}`);
    const label =
      typeof labelValue === "string" && /^image\d+$/i.test(labelValue)
        ? labelValue
        : `image${newFiles.length + 1}`;
    newFiles.push({ id: key, file: value, label });
  }

  return saveOwnFeatureNote({
    featureId: input.featureId,
    noteId: input.noteId,
    blocks: input.blocks,
    retainedAttachments: input.retainedAttachments,
    newFiles,
  });
}

export async function deleteOwnFeatureNoteAction(input: {
  featureId: string;
  noteId: string;
}): Promise<boolean> {
  return deleteOwnFeatureNote(input);
}
