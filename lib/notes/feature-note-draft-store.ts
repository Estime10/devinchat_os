import {
  areEditorAttachmentsEqual,
  isPersistedEditorAttachment,
  type EditorNoteAttachment,
} from "@/backend/features/04_features/domain/note-attachment";
import {
  hasNoteDocumentContent,
  isNoteDocumentDirty,
  type NoteBlock,
} from "@/backend/features/04_features/domain/note-block";
import { parseNoteDocument } from "@/backend/features/04_features/domain/note-document";

export type FeatureNoteDraft = {
  activeNoteId: string | null;
  blocks: NoteBlock[];
  baselineBlocks: NoteBlock[];
  attachments: EditorNoteAttachment[];
  baselineAttachments: EditorNoteAttachment[];
  pendingFiles: Map<string, File>;
};

const memoryDrafts = new Map<string, FeatureNoteDraft>();
const lastEditorByFeature = new Map<string, string | null>();

const SESSION_PREFIX = "devinchat:feature-note-draft:";
const SESSION_LAST_PREFIX = "devinchat:feature-note-last:";

type SessionDraftPayload = {
  activeNoteId: string | null;
  blocks: NoteBlock[];
  baselineBlocks: NoteBlock[];
  attachments: EditorNoteAttachment[];
  baselineAttachments: EditorNoteAttachment[];
};

function draftSlotKey(featureId: string, noteId: string | null): string {
  return `${featureId}:${noteId ?? "new"}`;
}

function writeLastEditor(featureId: string, noteId: string | null): void {
  lastEditorByFeature.set(featureId, noteId);
  if (typeof sessionStorage === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(
      `${SESSION_LAST_PREFIX}${featureId}`,
      noteId ?? "new",
    );
  } catch {
    // ignore
  }
}

function readLastEditor(featureId: string): string | null | undefined {
  if (lastEditorByFeature.has(featureId)) {
    return lastEditorByFeature.get(featureId);
  }
  if (typeof sessionStorage === "undefined") {
    return undefined;
  }
  try {
    const raw = sessionStorage.getItem(`${SESSION_LAST_PREFIX}${featureId}`);
    if (raw === null) {
      return undefined;
    }
    const noteId = raw === "new" ? null : raw;
    lastEditorByFeature.set(featureId, noteId);
    return noteId;
  } catch {
    return undefined;
  }
}

function cloneDraft(draft: FeatureNoteDraft): FeatureNoteDraft {
  return {
    activeNoteId: draft.activeNoteId,
    blocks: draft.blocks.map((block) => ({ ...block })),
    baselineBlocks: draft.baselineBlocks.map((block) => ({ ...block })),
    attachments: draft.attachments.map((item) => ({ ...item })),
    baselineAttachments: draft.baselineAttachments.map((item) => ({
      ...item,
    })),
    pendingFiles: new Map(draft.pendingFiles),
  };
}

function isDraftWorthKeeping(draft: FeatureNoteDraft): boolean {
  const hasContent =
    hasNoteDocumentContent(draft.blocks) || draft.attachments.length > 0;
  if (!hasContent) {
    return false;
  }
  return (
    isNoteDocumentDirty(draft.blocks, draft.baselineBlocks) ||
    !areEditorAttachmentsEqual(draft.attachments, draft.baselineAttachments)
  );
}

function toSessionPayload(draft: FeatureNoteDraft): SessionDraftPayload {
  // Images pending (blob) non sérialisables — le texte + images déjà en DB restent.
  const attachments = draft.attachments
    .filter(isPersistedEditorAttachment)
    .map((item) => ({ ...item }));
  const baselineAttachments = draft.baselineAttachments
    .filter(isPersistedEditorAttachment)
    .map((item) => ({ ...item }));
  return {
    activeNoteId: draft.activeNoteId,
    blocks: draft.blocks.map((block) => ({ ...block })),
    baselineBlocks: draft.baselineBlocks.map((block) => ({ ...block })),
    attachments,
    baselineAttachments,
  };
}

function writeSessionDraft(slotKey: string, draft: FeatureNoteDraft): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(
      `${SESSION_PREFIX}${slotKey}`,
      JSON.stringify(toSessionPayload(draft)),
    );
  } catch {
    // Quota / private mode — le draft mémoire reste.
  }
}

function readSessionDraft(slotKey: string): FeatureNoteDraft | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(`${SESSION_PREFIX}${slotKey}`);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const payload = parsed as Partial<SessionDraftPayload>;
    const blocks = parseNoteDocument(payload.blocks);
    const baselineBlocks = parseNoteDocument(payload.baselineBlocks);
    if (!blocks || !baselineBlocks) {
      return null;
    }
    const attachments = Array.isArray(payload.attachments)
      ? payload.attachments
          .filter(isPersistedEditorAttachment)
          .map((item, index) => ({
            ...item,
            label:
              typeof item.label === "string" && item.label.length > 0
                ? item.label
                : `image${index + 1}`,
          }))
      : [];
    const baselineAttachments = Array.isArray(payload.baselineAttachments)
      ? payload.baselineAttachments
          .filter(isPersistedEditorAttachment)
          .map((item, index) => ({
            ...item,
            label:
              typeof item.label === "string" && item.label.length > 0
                ? item.label
                : `image${index + 1}`,
          }))
      : [];
    return {
      activeNoteId:
        typeof payload.activeNoteId === "string" ||
        payload.activeNoteId === null
          ? payload.activeNoteId
          : null,
      blocks,
      baselineBlocks,
      attachments: attachments.map((item) => ({ ...item })),
      baselineAttachments: baselineAttachments.map((item) => ({ ...item })),
      pendingFiles: new Map(),
    };
  } catch {
    return null;
  }
}

function clearSessionDraft(slotKey: string): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  try {
    sessionStorage.removeItem(`${SESSION_PREFIX}${slotKey}`);
  } catch {
    // ignore
  }
}

/**
 * Mémorise le brouillon éditeur (mémoire + sessionStorage texte).
 * Pas de DB — uniquement pour survivre aux changements de feature / refresh.
 */
export function stashFeatureNoteDraft(
  featureId: string,
  draft: FeatureNoteDraft,
): void {
  const slotKey = draftSlotKey(featureId, draft.activeNoteId);
  writeLastEditor(featureId, draft.activeNoteId);

  if (!isDraftWorthKeeping(draft)) {
    memoryDrafts.delete(slotKey);
    clearSessionDraft(slotKey);
    return;
  }

  const stored = cloneDraft(draft);
  // Les blob URLs seront régénérées au restore depuis pendingFiles.
  stored.attachments = stored.attachments.map((item) =>
    isPersistedEditorAttachment(item) ? item : { ...item, url: "" },
  );
  // Drop pending entries without a File (session-only restore can't keep them).
  stored.attachments = stored.attachments.filter(
    (item) =>
      isPersistedEditorAttachment(item) || stored.pendingFiles.has(item.id),
  );
  memoryDrafts.set(slotKey, stored);
  writeSessionDraft(slotKey, stored);
}

/**
 * Restaure le dernier brouillon de la feature (note active au moment du stash).
 */
export function readLastFeatureNoteDraft(
  featureId: string,
): FeatureNoteDraft | null {
  const lastNoteId = readLastEditor(featureId);
  if (lastNoteId === undefined) {
    return null;
  }
  return readFeatureNoteDraft(featureId, lastNoteId);
}

export function readFeatureNoteDraft(
  featureId: string,
  noteId: string | null,
): FeatureNoteDraft | null {
  const slotKey = draftSlotKey(featureId, noteId);
  const memory = memoryDrafts.get(slotKey);
  if (memory) {
    return hydratePendingUrls(cloneDraft(memory));
  }
  const session = readSessionDraft(slotKey);
  if (!session || !isDraftWorthKeeping(session)) {
    return null;
  }
  return session;
}

export function clearFeatureNoteDraft(
  featureId: string,
  noteId: string | null,
): void {
  const slotKey = draftSlotKey(featureId, noteId);
  memoryDrafts.delete(slotKey);
  clearSessionDraft(slotKey);
}

export function rememberFeatureEditorNote(
  featureId: string,
  noteId: string | null,
): void {
  writeLastEditor(featureId, noteId);
}

/** Fichiers image pending (hors React render) — survivent aux changements de feature. */
const livePendingFiles = new Map<string, File>();

function hydratePendingUrls(draft: FeatureNoteDraft): FeatureNoteDraft {
  draft.attachments = draft.attachments.flatMap((item) => {
    if (isPersistedEditorAttachment(item)) {
      return [item];
    }
    const file =
      draft.pendingFiles.get(item.id) ?? livePendingFiles.get(item.id);
    if (!file) {
      return [];
    }
    draft.pendingFiles.set(item.id, file);
    return [
      {
        ...item,
        url: URL.createObjectURL(file),
        name: file.name,
        mimeType: file.type,
        size: file.size,
      },
    ];
  });
  return draft;
}

export function registerPendingAttachmentFile(id: string, file: File): void {
  livePendingFiles.set(id, file);
}

export function unregisterPendingAttachmentFile(id: string): void {
  livePendingFiles.delete(id);
}

export function clearLivePendingAttachmentFiles(ids?: readonly string[]): void {
  if (!ids) {
    livePendingFiles.clear();
    return;
  }
  for (const id of ids) {
    livePendingFiles.delete(id);
  }
}

export function collectPendingAttachmentFiles(
  attachments: readonly EditorNoteAttachment[],
): Map<string, File> {
  const map = new Map<string, File>();
  for (const item of attachments) {
    if (isPersistedEditorAttachment(item)) {
      continue;
    }
    const file = livePendingFiles.get(item.id);
    if (file) {
      map.set(item.id, file);
    }
  }
  return map;
}

export function restorePendingAttachmentFiles(files: Map<string, File>): void {
  for (const [id, file] of files) {
    livePendingFiles.set(id, file);
  }
}
