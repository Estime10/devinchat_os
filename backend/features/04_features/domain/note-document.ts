import { z } from "zod";
import type { NoteBlock } from "@/backend/features/04_features/domain/note-block";

export const noteBlockSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["paragraph", "heading", "bullet", "numbered"]),
  text: z.string(),
});

export const noteDocumentSchema = z.array(noteBlockSchema).min(1);

/**
 * Titre chip : début du premier texte non vide, court pour une rangée lisible.
 */
export function deriveNoteTitle(
  blocks: readonly NoteBlock[],
  maxLength = 18,
): string {
  const first = blocks.find((block) => block.text.trim().length > 0);
  if (!first) {
    return "Untitled";
  }
  const trimmed = first.text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}

export function parseNoteDocument(value: unknown): NoteBlock[] | null {
  const result = noteDocumentSchema.safeParse(value);
  return result.success ? result.data : null;
}
