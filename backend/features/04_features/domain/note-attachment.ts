import { z } from "zod";

export type NoteAttachment = {
  id: string;
  path: string;
  url: string;
  name: string;
  mimeType: string;
  size: number;
};

export const noteAttachmentSchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
  url: z.string().url(),
  name: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().nonnegative(),
});

export const noteAttachmentsSchema = z.array(noteAttachmentSchema);

export const NOTE_ATTACHMENT_BUCKET = "feature-note-attachments";
export const NOTE_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;
/** Formats acceptés au file picker (convertis en WebP avant upload). */
export const NOTE_ATTACHMENT_INPUT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
/** Format stocké dans le bucket. */
export const NOTE_ATTACHMENT_STORED_MIME = "image/webp" as const;

export function parseNoteAttachments(value: unknown): NoteAttachment[] {
  const result = noteAttachmentsSchema.safeParse(value);
  return result.success ? result.data : [];
}

export function areNoteAttachmentsEqual(
  a: readonly NoteAttachment[],
  b: readonly NoteAttachment[],
): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((item, index) => {
    const other = b[index];
    return (
      !!other &&
      item.id === other.id &&
      item.path === other.path &&
      item.url === other.url
    );
  });
}

export function createNoteAttachmentId(): string {
  return crypto.randomUUID();
}
