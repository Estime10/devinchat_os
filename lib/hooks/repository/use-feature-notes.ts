"use client";

import {
  areEditorAttachmentsEqual,
  createNoteAttachmentId,
  isPersistedEditorAttachment,
  removeNoteAttachmentRefFromBlocks,
  toEditorNoteAttachment,
  type EditorNoteAttachment,
  type NoteAttachment,
} from "@/backend/features/04_features/domain/note-attachment";
import {
  createEmptyNoteDocument,
  hasNoteDocumentContent,
  isNoteDocumentDirty,
  type NoteBlock,
} from "@/backend/features/04_features/domain/note-block";
import type { OwnFeatureNote } from "@/backend/features/04_features/types/own-feature-note";
import {
  deleteOwnFeatureNoteAction,
  listOwnFeatureNotesAction,
  removeOwnFeatureNoteAttachmentAction,
  saveOwnFeatureNoteAction,
} from "@/backend/features/04_features/mutations/feature-notes";
import {
  clearFeatureNoteDraft,
  clearLivePendingAttachmentFiles,
  collectPendingAttachmentFiles,
  readFeatureNoteDraft,
  readLastFeatureNoteDraft,
  registerPendingAttachmentFile,
  rememberFeatureEditorNote,
  restorePendingAttachmentFiles,
  stashFeatureNoteDraft,
  unregisterPendingAttachmentFile,
  type FeatureNoteDraft,
} from "@/lib/notes/feature-note-draft-store";
import { useEffect, useRef, useState, useTransition } from "react";

function cloneBlocks(blocks: readonly NoteBlock[]): NoteBlock[] {
  return blocks.map((block) => ({ ...block }));
}

function cloneEditorAttachments(
  attachments: readonly EditorNoteAttachment[],
): EditorNoteAttachment[] {
  return attachments.map((item) => ({ ...item }));
}

function toPersistedAttachments(
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

function revokeEditorAttachmentUrl(attachment: EditorNoteAttachment): void {
  if (
    !isPersistedEditorAttachment(attachment) &&
    attachment.url.startsWith("blob:")
  ) {
    URL.revokeObjectURL(attachment.url);
  }
}

function revokeEditorAttachmentUrls(
  attachments: readonly EditorNoteAttachment[],
): void {
  for (const attachment of attachments) {
    revokeEditorAttachmentUrl(attachment);
  }
}

function pendingIds(attachments: readonly EditorNoteAttachment[]): string[] {
  return attachments
    .filter((item) => !isPersistedEditorAttachment(item))
    .map((item) => item.id);
}

/**
 * Notes DB d’une feature — rien en DB avant [ save ].
 * Draft local (mémoire + session) pour ne pas perdre le travail en cours.
 */
export function useFeatureNotes(featureId: string | null): {
  blocks: NoteBlock[];
  setBlocks: (blocks: NoteBlock[]) => void;
  attachments: EditorNoteAttachment[];
  notes: OwnFeatureNote[];
  activeNoteId: string | null;
  canSave: boolean;
  canClear: boolean;
  canDelete: boolean;
  canStartNew: boolean;
  isPending: boolean;
  error: string | null;
  selectNote: (noteId: string) => void;
  startNewNote: () => void;
  saveNote: () => Promise<void>;
  clearNote: () => void;
  deleteNote: () => Promise<void>;
  addAttachment: (file: File, label: string) => Promise<void>;
  removeAttachment: (attachmentId: string) => void;
} {
  const [bootDraft] = useState<FeatureNoteDraft | null>(() =>
    featureId !== null ? readLastFeatureNoteDraft(featureId) : null,
  );

  const [blocks, setBlocksState] = useState<NoteBlock[]>(() =>
    bootDraft ? cloneBlocks(bootDraft.blocks) : createEmptyNoteDocument(),
  );
  const [baselineBlocks, setBaselineBlocks] = useState<NoteBlock[]>(() =>
    bootDraft
      ? cloneBlocks(bootDraft.baselineBlocks)
      : createEmptyNoteDocument(),
  );
  const [attachments, setAttachments] = useState<EditorNoteAttachment[]>(() =>
    bootDraft ? cloneEditorAttachments(bootDraft.attachments) : [],
  );
  const [baselineAttachments, setBaselineAttachments] = useState<
    EditorNoteAttachment[]
  >(() =>
    bootDraft ? cloneEditorAttachments(bootDraft.baselineAttachments) : [],
  );
  const [notes, setNotes] = useState<OwnFeatureNote[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(
    () => bootDraft?.activeNoteId ?? null,
  );
  const [activeFeatureId, setActiveFeatureId] = useState(featureId);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const blocksRef = useRef(blocks);
  const baselineBlocksRef = useRef(baselineBlocks);
  const attachmentsRef = useRef(attachments);
  const baselineAttachmentsRef = useRef(baselineAttachments);
  const activeNoteIdRef = useRef(activeNoteId);
  const activeFeatureIdRef = useRef(activeFeatureId);

  useEffect(() => {
    if (bootDraft && bootDraft.pendingFiles.size > 0) {
      restorePendingAttachmentFiles(bootDraft.pendingFiles);
    }
  }, [bootDraft]);

  const captureDraftFromState = (
    noteId: string | null,
    nextBlocks: NoteBlock[],
    nextBaselineBlocks: NoteBlock[],
    nextAttachments: EditorNoteAttachment[],
    nextBaselineAttachments: EditorNoteAttachment[],
  ): FeatureNoteDraft => ({
    activeNoteId: noteId,
    blocks: cloneBlocks(nextBlocks),
    baselineBlocks: cloneBlocks(nextBaselineBlocks),
    attachments: cloneEditorAttachments(nextAttachments),
    baselineAttachments: cloneEditorAttachments(nextBaselineAttachments),
    pendingFiles: collectPendingAttachmentFiles(nextAttachments),
  });

  const applyDraft = (
    draft: FeatureNoteDraft,
    previousAttachments: readonly EditorNoteAttachment[],
  ) => {
    // Révoque seulement les blob URLs affichés — les File restent en mémoire live.
    revokeEditorAttachmentUrls(previousAttachments);
    restorePendingAttachmentFiles(draft.pendingFiles);
    setActiveNoteId(draft.activeNoteId);
    setBlocksState(cloneBlocks(draft.blocks));
    setBaselineBlocks(cloneBlocks(draft.baselineBlocks));
    setAttachments(cloneEditorAttachments(draft.attachments));
    setBaselineAttachments(cloneEditorAttachments(draft.baselineAttachments));
  };

  const applyEmptyEditor = (
    previousAttachments: readonly EditorNoteAttachment[],
    options?: { discardPendingFiles?: boolean },
  ) => {
    revokeEditorAttachmentUrls(previousAttachments);
    if (options?.discardPendingFiles) {
      clearLivePendingAttachmentFiles(pendingIds(previousAttachments));
    }
    const nextEmpty = createEmptyNoteDocument();
    setActiveNoteId(null);
    setBlocksState(nextEmpty);
    setBaselineBlocks(cloneBlocks(nextEmpty));
    setAttachments([]);
    setBaselineAttachments([]);
  };

  const parkCurrentDraft = (
    forFeatureId: string,
    noteId: string | null,
    nextBlocks: NoteBlock[],
    nextBaselineBlocks: NoteBlock[],
    nextAttachments: EditorNoteAttachment[],
    nextBaselineAttachments: EditorNoteAttachment[],
  ) => {
    stashFeatureNoteDraft(
      forFeatureId,
      captureDraftFromState(
        noteId,
        nextBlocks,
        nextBaselineBlocks,
        nextAttachments,
        nextBaselineAttachments,
      ),
    );
  };

  if (featureId !== activeFeatureId) {
    if (activeFeatureId) {
      parkCurrentDraft(
        activeFeatureId,
        activeNoteId,
        blocks,
        baselineBlocks,
        attachments,
        baselineAttachments,
      );
    }

    setActiveFeatureId(featureId);
    setNotes([]);
    setError(null);

    if (featureId) {
      const draft = readLastFeatureNoteDraft(featureId);
      if (draft) {
        applyDraft(draft, attachments);
      } else {
        applyEmptyEditor(attachments);
      }
    } else {
      applyEmptyEditor(attachments);
    }
  }

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    baselineBlocksRef.current = baselineBlocks;
  }, [baselineBlocks]);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    baselineAttachmentsRef.current = baselineAttachments;
  }, [baselineAttachments]);

  useEffect(() => {
    activeNoteIdRef.current = activeNoteId;
  }, [activeNoteId]);

  useEffect(() => {
    activeFeatureIdRef.current = activeFeatureId;
  }, [activeFeatureId]);

  useEffect(() => {
    if (!featureId) {
      return;
    }
    let cancelled = false;
    startTransition(async () => {
      const next = await listOwnFeatureNotesAction(featureId);
      if (cancelled) {
        return;
      }
      if (next === null) {
        setNotes([]);
        setError("Could not load notes.");
        return;
      }
      setNotes(next);
    });
    return () => {
      cancelled = true;
    };
  }, [featureId]);

  useEffect(() => {
    return () => {
      const id = activeFeatureIdRef.current;
      if (id) {
        stashFeatureNoteDraft(id, {
          activeNoteId: activeNoteIdRef.current,
          blocks: cloneBlocks(blocksRef.current),
          baselineBlocks: cloneBlocks(baselineBlocksRef.current),
          attachments: cloneEditorAttachments(attachmentsRef.current),
          baselineAttachments: cloneEditorAttachments(
            baselineAttachmentsRef.current,
          ),
          pendingFiles: collectPendingAttachmentFiles(attachmentsRef.current),
        });
      }
    };
  }, []);

  const setBlocks = (next: NoteBlock[]) => {
    setBlocksState(next.length > 0 ? next : createEmptyNoteDocument());
  };

  const selectNote = (noteId: string) => {
    const id = featureId;
    if (!id) {
      return;
    }

    parkCurrentDraft(
      id,
      activeNoteId,
      blocks,
      baselineBlocks,
      attachments,
      baselineAttachments,
    );
    rememberFeatureEditorNote(id, noteId);

    const draft = readFeatureNoteDraft(id, noteId);
    if (draft) {
      applyDraft(draft, attachments);
      setError(null);
      return;
    }

    const note = notes.find((item) => item.id === noteId);
    if (!note) {
      return;
    }
    revokeEditorAttachmentUrls(attachments);
    const nextBlocks =
      note.blocks.length > 0 ? note.blocks : createEmptyNoteDocument();
    const nextAttachments = note.attachments.map(toEditorNoteAttachment);
    setActiveNoteId(note.id);
    setBlocksState(nextBlocks);
    setBaselineBlocks(cloneBlocks(nextBlocks));
    setAttachments(nextAttachments);
    setBaselineAttachments(cloneEditorAttachments(nextAttachments));
    setError(null);
  };

  const startNewNote = () => {
    const id = featureId;
    if (id) {
      parkCurrentDraft(
        id,
        activeNoteId,
        blocks,
        baselineBlocks,
        attachments,
        baselineAttachments,
      );
      rememberFeatureEditorNote(id, null);
      const draft = readFeatureNoteDraft(id, null);
      if (draft) {
        applyDraft(draft, attachments);
        setError(null);
        return;
      }
    }
    applyEmptyEditor(attachments);
    setError(null);
  };

  const saveNote = async () => {
    const id = featureId;
    if (!id) {
      return;
    }
    const current = attachmentsRef.current;
    const hasText = hasNoteDocumentContent(blocksRef.current);
    const hasFiles = current.length > 0;
    if (!hasText && !hasFiles) {
      return;
    }
    const dirtyText = isNoteDocumentDirty(
      blocksRef.current,
      baselineBlocksRef.current,
    );
    const dirtyFiles = !areEditorAttachmentsEqual(
      current,
      baselineAttachmentsRef.current,
    );
    if (!dirtyText && !dirtyFiles) {
      return;
    }

    const previousNoteId = activeNoteIdRef.current;

    startTransition(async () => {
      setError(null);
      const retained = toPersistedAttachments(current);
      const formData = new FormData();
      const pendingFiles = collectPendingAttachmentFiles(current);
      for (const item of current) {
        if (isPersistedEditorAttachment(item)) {
          continue;
        }
        const file = pendingFiles.get(item.id);
        if (file) {
          formData.set(item.id, file);
          formData.set(`label:${item.id}`, item.label);
        }
      }

      const removedFromBaseline = baselineAttachmentsRef.current
        .filter(isPersistedEditorAttachment)
        .filter((item) => !current.some((entry) => entry.id === item.id));

      const saved = await saveOwnFeatureNoteAction({
        featureId: id,
        noteId: previousNoteId,
        blocks: blocksRef.current,
        retainedAttachments: retained,
        formData,
      });
      if (!saved) {
        setError("Could not save note.");
        return;
      }

      if (removedFromBaseline.length > 0) {
        await Promise.all(
          removedFromBaseline.map((item) =>
            removeOwnFeatureNoteAttachmentAction({ path: item.path }),
          ),
        );
      }

      revokeEditorAttachmentUrls(
        current.filter((item) => !isPersistedEditorAttachment(item)),
      );
      clearLivePendingAttachmentFiles(pendingIds(current));

      clearFeatureNoteDraft(id, previousNoteId);
      clearFeatureNoteDraft(id, saved.id);
      rememberFeatureEditorNote(id, saved.id);

      const nextAttachments = saved.attachments.map(toEditorNoteAttachment);
      setActiveNoteId(saved.id);
      setBlocksState(saved.blocks);
      setBaselineBlocks(cloneBlocks(saved.blocks));
      setAttachments(nextAttachments);
      setBaselineAttachments(cloneEditorAttachments(nextAttachments));

      const refreshed = await listOwnFeatureNotesAction(id);
      if (refreshed === null) {
        setNotes((prev) => {
          const without = prev.filter((note) => note.id !== saved.id);
          return [saved, ...without];
        });
        setError("Note saved, but list refresh failed.");
        return;
      }
      setNotes(refreshed);
    });
  };

  const deleteNote = async () => {
    const id = featureId;
    const noteId = activeNoteIdRef.current;
    if (!id || !noteId) {
      return;
    }

    startTransition(async () => {
      setError(null);
      const ok = await deleteOwnFeatureNoteAction({ featureId: id, noteId });
      if (!ok) {
        setError("Could not delete note.");
        return;
      }
      clearFeatureNoteDraft(id, noteId);
      rememberFeatureEditorNote(id, null);
      applyEmptyEditor(attachmentsRef.current, { discardPendingFiles: true });
      const refreshed = await listOwnFeatureNotesAction(id);
      if (refreshed === null) {
        setNotes((prev) => prev.filter((note) => note.id !== noteId));
        setError("Note deleted, but list refresh failed.");
        return;
      }
      setNotes(refreshed);
    });
  };

  const addAttachment = async (file: File, label: string) => {
    if (!featureId) {
      return;
    }

    startTransition(async () => {
      try {
        const { convertImageFileToWebp } =
          await import("@/lib/notes/convert-image-to-webp");
        const webpFile = await convertImageFileToWebp(file);
        const id = createNoteAttachmentId();
        const url = URL.createObjectURL(webpFile);
        registerPendingAttachmentFile(id, webpFile);
        setAttachments((current) => [
          ...current,
          {
            id,
            path: null,
            url,
            name: webpFile.name,
            mimeType: webpFile.type,
            size: webpFile.size,
            label,
          },
        ]);
        setError(null);
      } catch {
        setError("Could not prepare image.");
      }
    });
  };

  const removeAttachment = (attachmentId: string) => {
    const target = attachmentsRef.current.find(
      (item) => item.id === attachmentId,
    );
    if (!target) {
      return;
    }
    revokeEditorAttachmentUrl(target);
    unregisterPendingAttachmentFile(attachmentId);
    setAttachments((current) =>
      current.filter((item) => item.id !== attachmentId),
    );
    setBlocks(
      removeNoteAttachmentRefFromBlocks(blocksRef.current, target.label),
    );
  };

  const clearNote = () => {
    const dirtyText = isNoteDocumentDirty(
      blocksRef.current,
      baselineBlocksRef.current,
    );
    const dirtyFiles = !areEditorAttachmentsEqual(
      attachmentsRef.current,
      baselineAttachmentsRef.current,
    );
    if (!dirtyText && !dirtyFiles) {
      return;
    }

    revokeEditorAttachmentUrls(
      attachmentsRef.current.filter(
        (item) => !isPersistedEditorAttachment(item),
      ),
    );
    clearLivePendingAttachmentFiles(pendingIds(attachmentsRef.current));

    const id = featureId;
    if (id) {
      clearFeatureNoteDraft(id, activeNoteIdRef.current);
    }

    setBlocksState(cloneBlocks(baselineBlocksRef.current));
    setAttachments(cloneEditorAttachments(baselineAttachmentsRef.current));
    setError(null);
  };

  const hasContent = hasNoteDocumentContent(blocks) || attachments.length > 0;
  const isDirty =
    isNoteDocumentDirty(blocks, baselineBlocks) ||
    !areEditorAttachmentsEqual(attachments, baselineAttachments);
  const isPersisted = activeNoteId !== null;

  return {
    blocks,
    setBlocks,
    attachments,
    notes,
    activeNoteId,
    canSave: hasContent && isDirty,
    canClear: isDirty,
    canDelete: isPersisted,
    canStartNew: isPersisted || notes.length > 0,
    isPending,
    error,
    selectNote,
    startNewNote,
    saveNote,
    clearNote,
    deleteNote,
    addAttachment,
    removeAttachment,
  };
}
