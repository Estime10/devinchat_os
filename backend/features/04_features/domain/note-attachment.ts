import { z } from "zod";

export type NoteAttachment = {
  id: string;
  path: string;
  url: string;
  name: string;
  mimeType: string;
  size: number;
  /** Ref affichée dans le texte — ex. image1 (stable). */
  label: string;
};

/** Pièce jointe éditeur — `path` null = locale, pas encore en storage. */
export type EditorNoteAttachment = {
  id: string;
  path: string | null;
  url: string;
  name: string;
  mimeType: string;
  size: number;
  label: string;
};

export const noteAttachmentSchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
  url: z.string().url(),
  name: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().nonnegative(),
  label: z
    .string()
    .regex(/^image\d+$/i)
    .optional(),
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

const ATTACHMENT_REF_PATTERN = /^image(\d+)$/i;

export function parseNoteAttachments(value: unknown): NoteAttachment[] {
  const result = noteAttachmentsSchema.safeParse(value);
  if (!result.success) {
    return [];
  }
  return result.data.map((item, index) => ({
    ...item,
    label: item.label ?? `image${index + 1}`,
  }));
}

export function toEditorNoteAttachment(
  attachment: NoteAttachment,
): EditorNoteAttachment {
  return {
    id: attachment.id,
    path: attachment.path,
    url: attachment.url,
    name: attachment.name,
    mimeType: attachment.mimeType,
    size: attachment.size,
    label: attachment.label,
  };
}

export function isPersistedEditorAttachment(
  attachment: EditorNoteAttachment,
): attachment is EditorNoteAttachment & { path: string } {
  return typeof attachment.path === "string" && attachment.path.length > 0;
}

export function areEditorAttachmentsEqual(
  a: readonly EditorNoteAttachment[],
  b: readonly EditorNoteAttachment[],
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
      item.url === other.url &&
      item.label === other.label
    );
  });
}

export function createNoteAttachmentId(): string {
  return crypto.randomUUID();
}

/** Prochain label stable imageN (ne réutilise pas les numéros existants). */
export function nextNoteAttachmentLabel(
  attachments: readonly { label: string }[],
): string {
  let max = 0;
  for (const item of attachments) {
    const match = ATTACHMENT_REF_PATTERN.exec(item.label);
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }
  return `image${max + 1}`;
}

/** True si le bloc texte est une ref image (image1, image2, …). */
export function isNoteAttachmentRefText(text: string): boolean {
  return ATTACHMENT_REF_PATTERN.test(text.trim());
}
