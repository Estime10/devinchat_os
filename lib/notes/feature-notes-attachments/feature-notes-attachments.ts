import {
  createNoteAttachmentId,
  isPersistedEditorAttachment,
  removeNoteAttachmentRefFromBlocks,
  type EditorNoteAttachment,
} from "@/backend/features/04_features/domain/note-attachment/note-attachment";
import type { NoteBlock } from "@/backend/features/04_features/domain/note-block/note-block";
import {
  registerPendingAttachmentFile,
  unregisterPendingAttachmentFile,
} from "@/lib/notes/feature-note-draft-store/feature-note-draft-store";
import { revokeEditorAttachmentUrl } from "@/lib/notes/feature-notes-editor-utils/feature-notes-editor-utils";

/**
 * Convertit + enregistre un pending attachment (blob URL).
 */
export async function prepareFeatureNoteAttachment(input: {
  file: File;
  label: string;
}): Promise<EditorNoteAttachment> {
  const { convertImageFileToWebp } =
    await import("@/lib/notes/convert-image-to-webp/convert-image-to-webp");
  const webpFile = await convertImageFileToWebp(input.file);
  const id = createNoteAttachmentId();
  const url = URL.createObjectURL(webpFile);
  registerPendingAttachmentFile(id, webpFile);
  return {
    id,
    path: null,
    url,
    name: webpFile.name,
    mimeType: webpFile.type,
    size: webpFile.size,
    label: input.label,
  };
}

/**
 * Retire un attachment + refs dans les blocs.
 */
export function removeFeatureNoteAttachment(input: {
  attachmentId: string;
  attachments: readonly EditorNoteAttachment[];
  blocks: readonly NoteBlock[];
}): {
  attachments: EditorNoteAttachment[];
  blocks: NoteBlock[];
} | null {
  const target = input.attachments.find(
    (item) => item.id === input.attachmentId,
  );
  if (!target) {
    return null;
  }
  revokeEditorAttachmentUrl(target);
  unregisterPendingAttachmentFile(input.attachmentId);
  return {
    attachments: input.attachments.filter(
      (item) => item.id !== input.attachmentId,
    ),
    blocks: removeNoteAttachmentRefFromBlocks(input.blocks, target.label),
  };
}

export function revokePendingEditorAttachments(
  attachments: readonly EditorNoteAttachment[],
): void {
  for (const item of attachments) {
    if (!isPersistedEditorAttachment(item)) {
      revokeEditorAttachmentUrl(item);
    }
  }
}
