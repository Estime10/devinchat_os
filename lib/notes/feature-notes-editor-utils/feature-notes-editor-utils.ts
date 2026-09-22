import {
  isPersistedEditorAttachment,
  type EditorNoteAttachment,
  type NoteAttachment,
} from "@/backend/features/04_features/domain/note-attachment/note-attachment";
import type { NoteBlock } from "@/backend/features/04_features/domain/note-block/note-block";
import type { FeatureNoteDraft } from "@/lib/notes/feature-note-draft-store/feature-note-draft-store";
import {
  collectPendingAttachmentFiles,
  restorePendingAttachmentFiles,
} from "@/lib/notes/feature-note-draft-store/feature-note-draft-store";

export function cloneBlocks(blocks: readonly NoteBlock[]): NoteBlock[] {
  return blocks.map((block) => ({ ...block }));
}

export function cloneEditorAttachments(
  attachments: readonly EditorNoteAttachment[],
): EditorNoteAttachment[] {
  return attachments.map((item) => ({ ...item }));
}

export function toPersistedAttachments(
  attachments: readonly EditorNoteAttachment[],
): NoteAttachment[] {
  return attachments.filter(isPersistedEditorAttachment).map((item) => ({
    id: item.id,
    path: item.path,
    url: item.url,
    name: item.name,
    mimeType: item.mimeType,
    size: item.size,
    label: item.label,
  }));
}

export function revokeEditorAttachmentUrl(
  attachment: EditorNoteAttachment,
): void {
  if (
    !isPersistedEditorAttachment(attachment) &&
    attachment.url.startsWith("blob:")
  ) {
    URL.revokeObjectURL(attachment.url);
  }
}

export function revokeEditorAttachmentUrls(
  attachments: readonly EditorNoteAttachment[],
): void {
  for (const attachment of attachments) {
    revokeEditorAttachmentUrl(attachment);
  }
}

export function pendingAttachmentIds(
  attachments: readonly EditorNoteAttachment[],
): string[] {
  return attachments
    .filter((item) => !isPersistedEditorAttachment(item))
    .map((item) => item.id);
}

export function captureFeatureNoteDraft(input: {
  noteId: string | null;
  blocks: NoteBlock[];
  baselineBlocks: NoteBlock[];
  attachments: EditorNoteAttachment[];
  baselineAttachments: EditorNoteAttachment[];
}): FeatureNoteDraft {
  return {
    activeNoteId: input.noteId,
    blocks: cloneBlocks(input.blocks),
    baselineBlocks: cloneBlocks(input.baselineBlocks),
    attachments: cloneEditorAttachments(input.attachments),
    baselineAttachments: cloneEditorAttachments(input.baselineAttachments),
    pendingFiles: collectPendingAttachmentFiles(input.attachments),
  };
}

export function applyFeatureNoteDraftView(input: {
  draft: FeatureNoteDraft;
  previousAttachments: readonly EditorNoteAttachment[];
  setActiveNoteId: (id: string | null) => void;
  setBlocks: (blocks: NoteBlock[]) => void;
  setBaselineBlocks: (blocks: NoteBlock[]) => void;
  setAttachments: (attachments: EditorNoteAttachment[]) => void;
  setBaselineAttachments: (attachments: EditorNoteAttachment[]) => void;
}): void {
  revokeEditorAttachmentUrls(input.previousAttachments);
  restorePendingAttachmentFiles(input.draft.pendingFiles);
  input.setActiveNoteId(input.draft.activeNoteId);
  input.setBlocks(cloneBlocks(input.draft.blocks));
  input.setBaselineBlocks(cloneBlocks(input.draft.baselineBlocks));
  input.setAttachments(cloneEditorAttachments(input.draft.attachments));
  input.setBaselineAttachments(
    cloneEditorAttachments(input.draft.baselineAttachments),
  );
}
