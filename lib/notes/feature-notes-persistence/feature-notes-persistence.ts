import {
  areEditorAttachmentsEqual,
  isPersistedEditorAttachment,
  type EditorNoteAttachment,
} from "@/backend/features/04_features/domain/note-attachment/note-attachment";
import {
  hasNoteDocumentContent,
  isNoteDocumentDirty,
  type NoteBlock,
} from "@/backend/features/04_features/domain/note-block/note-block";
import type { OwnFeatureNote } from "@/backend/features/04_features/types/own-feature-note/own-feature-note";
import {
  deleteOwnFeatureNoteAction,
  listOwnFeatureNotesAction,
  saveOwnFeatureNoteAction,
} from "@/backend/features/04_features/mutations/feature-notes";
import {
  clearFeatureNoteDraft,
  clearLivePendingAttachmentFiles,
  collectPendingAttachmentFiles,
  rememberFeatureEditorNote,
} from "@/lib/notes/feature-note-draft-store/feature-note-draft-store";
import { toEditorNoteAttachment } from "@/backend/features/04_features/domain/note-attachment/note-attachment";
import {
  cloneBlocks,
  cloneEditorAttachments,
  pendingAttachmentIds,
  revokeEditorAttachmentUrls,
  toPersistedAttachments,
} from "@/lib/notes/feature-notes-editor-utils/feature-notes-editor-utils";

export async function persistFeatureNote(input: {
  featureId: string;
  noteId: string | null;
  expectedUpdatedAt: string | null;
  blocks: NoteBlock[];
  baselineBlocks: NoteBlock[];
  attachments: EditorNoteAttachment[];
  baselineAttachments: EditorNoteAttachment[];
}): Promise<
  | { ok: true; saved: OwnFeatureNote }
  | { ok: false; reason: "empty" | "clean" | "persist" }
> {
  const hasText = hasNoteDocumentContent(input.blocks);
  const hasFiles = input.attachments.length > 0;
  if (!hasText && !hasFiles) {
    return { ok: false, reason: "empty" };
  }

  const dirtyText = isNoteDocumentDirty(input.blocks, input.baselineBlocks);
  const dirtyFiles = !areEditorAttachmentsEqual(
    input.attachments,
    input.baselineAttachments,
  );
  if (!dirtyText && !dirtyFiles) {
    return { ok: false, reason: "clean" };
  }

  const formData = new FormData();
  const pendingFiles = collectPendingAttachmentFiles(input.attachments);
  for (const item of input.attachments) {
    if (isPersistedEditorAttachment(item)) {
      continue;
    }
    const file = pendingFiles.get(item.id);
    if (file) {
      formData.set(item.id, file);
      formData.set(`label:${item.id}`, item.label);
    }
  }

  const saved = await saveOwnFeatureNoteAction({
    featureId: input.featureId,
    noteId: input.noteId,
    expectedUpdatedAt: input.noteId ? input.expectedUpdatedAt : null,
    blocks: input.blocks,
    retainedAttachments: toPersistedAttachments(input.attachments),
    formData,
  });

  if (!saved) {
    return { ok: false, reason: "persist" };
  }

  revokeEditorAttachmentUrls(
    input.attachments.filter((item) => !isPersistedEditorAttachment(item)),
  );
  clearLivePendingAttachmentFiles(pendingAttachmentIds(input.attachments));
  clearFeatureNoteDraft(input.featureId, input.noteId);
  clearFeatureNoteDraft(input.featureId, saved.id);
  rememberFeatureEditorNote(input.featureId, saved.id);

  return { ok: true, saved };
}

export function applySavedFeatureNote(input: {
  saved: OwnFeatureNote;
  setActiveNoteId: (id: string | null) => void;
  setBlocks: (blocks: NoteBlock[]) => void;
  setBaselineBlocks: (blocks: NoteBlock[]) => void;
  setAttachments: (attachments: EditorNoteAttachment[]) => void;
  setBaselineAttachments: (attachments: EditorNoteAttachment[]) => void;
}): void {
  const nextAttachments = input.saved.attachments.map(toEditorNoteAttachment);
  input.setActiveNoteId(input.saved.id);
  input.setBlocks(input.saved.blocks);
  input.setBaselineBlocks(cloneBlocks(input.saved.blocks));
  input.setAttachments(nextAttachments);
  input.setBaselineAttachments(cloneEditorAttachments(nextAttachments));
}

export async function refreshFeatureNotesList(
  featureId: string,
): Promise<OwnFeatureNote[] | null> {
  return listOwnFeatureNotesAction(featureId);
}

export async function removePersistedFeatureNote(input: {
  featureId: string;
  noteId: string;
}): Promise<boolean> {
  const ok = await deleteOwnFeatureNoteAction(input);
  if (!ok) {
    return false;
  }
  clearFeatureNoteDraft(input.featureId, input.noteId);
  rememberFeatureEditorNote(input.featureId, null);
  return true;
}
