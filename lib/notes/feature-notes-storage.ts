import { z } from "zod";
import {
  createEmptyNoteDocument,
  type NoteBlock,
} from "@/backend/features/04_features/domain/note-block";

const noteBlockSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["paragraph", "heading", "bullet", "numbered"]),
  text: z.string(),
});

const noteDocumentSchema = z.array(noteBlockSchema).min(1);

const STORAGE_PREFIX = "devinchat:feature-notes:";

function storageKey(featureId: string): string {
  return `${STORAGE_PREFIX}${featureId}`;
}

/**
 * Charge les notes d’une feature (localStorage). Fallback doc vide si invalide.
 */
export function loadFeatureNotes(featureId: string): NoteBlock[] {
  if (typeof window === "undefined") {
    return createEmptyNoteDocument();
  }

  try {
    const raw = window.localStorage.getItem(storageKey(featureId));
    if (!raw) {
      return createEmptyNoteDocument();
    }
    const parsed: unknown = JSON.parse(raw);
    const result = noteDocumentSchema.safeParse(parsed);
    if (!result.success) {
      return createEmptyNoteDocument();
    }
    return result.data;
  } catch {
    return createEmptyNoteDocument();
  }
}

/**
 * Persiste les notes d’une feature (localStorage).
 */
export function saveFeatureNotes(
  featureId: string,
  blocks: readonly NoteBlock[],
): void {
  if (typeof window === "undefined") {
    return;
  }

  const result = noteDocumentSchema.safeParse(blocks);
  if (!result.success) {
    return;
  }

  window.localStorage.setItem(
    storageKey(featureId),
    JSON.stringify(result.data),
  );
}
