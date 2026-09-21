"use server";

import type { NoteAttachment } from "@/backend/features/04_features/domain/note-attachment";
import type { NoteBlock } from "@/backend/features/04_features/domain/note-block";
import type { OwnFeatureNote } from "@/backend/features/04_features/types/own-feature-note";
import { deleteOwnFeatureNote } from "@/backend/features/04_features/services/delete-own-feature-note";
import { listOwnFeatureNotes } from "@/backend/features/04_features/services/list-own-feature-notes";
import { upsertOwnFeatureNote } from "@/backend/features/04_features/services/upsert-own-feature-note";
import {
  removeOwnFeatureNoteAttachmentFiles,
  uploadOwnFeatureNoteAttachment,
} from "@/backend/features/04_features/services/upload-own-feature-note-attachment";

export async function listOwnFeatureNotesAction(
  featureId: string,
): Promise<OwnFeatureNote[]> {
  const notes = await listOwnFeatureNotes(featureId);
  return notes ?? [];
}

export async function saveOwnFeatureNoteAction(input: {
  featureId: string;
  noteId?: string | null;
  blocks: NoteBlock[];
  attachments: NoteAttachment[];
}): Promise<OwnFeatureNote | null> {
  return upsertOwnFeatureNote(input);
}

export async function deleteOwnFeatureNoteAction(input: {
  featureId: string;
  noteId: string;
}): Promise<boolean> {
  return deleteOwnFeatureNote(input);
}

export async function uploadOwnFeatureNoteAttachmentAction(input: {
  featureId: string;
  noteId?: string | null;
  formData: FormData;
}): Promise<NoteAttachment | null> {
  const file = input.formData.get("file");
  if (!(file instanceof File)) {
    return null;
  }
  return uploadOwnFeatureNoteAttachment({
    featureId: input.featureId,
    noteId: input.noteId,
    file,
  });
}

export async function removeOwnFeatureNoteAttachmentAction(input: {
  path: string;
}): Promise<boolean> {
  await removeOwnFeatureNoteAttachmentFiles([input.path]);
  return true;
}
