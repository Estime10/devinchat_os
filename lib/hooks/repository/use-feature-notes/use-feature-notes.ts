"use client";

import {
  areEditorAttachmentsEqual,
  toEditorNoteAttachment,
  type EditorNoteAttachment,
} from "@/backend/features/04_features/domain/note-attachment/note-attachment";
import {
  createEmptyNoteDocument,
  hasNoteDocumentContent,
  isNoteDocumentDirty,
  type NoteBlock,
} from "@/backend/features/04_features/domain/note-block/note-block";
import type { OwnFeatureNote } from "@/backend/features/04_features/types/own-feature-note/own-feature-note";
import { listOwnFeatureNotesAction } from "@/backend/features/04_features/mutations/feature-notes";
import {
  clearFeatureNoteDraft,
  clearLivePendingAttachmentFiles,
  collectPendingAttachmentFiles,
  readFeatureNoteDraft,
  readLastFeatureNoteDraft,
  rememberFeatureEditorNote,
  restorePendingAttachmentFiles,
  stashFeatureNoteDraft,
  type FeatureNoteDraft,
} from "@/lib/notes/feature-note-draft-store/feature-note-draft-store";
import {
  prepareFeatureNoteAttachment,
  removeFeatureNoteAttachment,
  revokePendingEditorAttachments,
} from "@/lib/notes/feature-notes-attachments/feature-notes-attachments";
import {
  applyFeatureNoteDraftView,
  captureFeatureNoteDraft,
  cloneBlocks,
  cloneEditorAttachments,
  pendingAttachmentIds,
  revokeEditorAttachmentUrls,
} from "@/lib/notes/feature-notes-editor-utils/feature-notes-editor-utils";
import {
  applySavedFeatureNote,
  persistFeatureNote,
  refreshFeatureNotesList,
  removePersistedFeatureNote,
} from "@/lib/notes/feature-notes-persistence/feature-notes-persistence";
import { useEffect, useRef, useState, useTransition } from "react";

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
  hasLoadedNotes: boolean;
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
  const [hasLoadedNotes, setHasLoadedNotes] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(
    () => bootDraft?.activeNoteId ?? null,
  );
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState<string | null>(
    null,
  );
  const [activeFeatureId, setActiveFeatureId] = useState(featureId);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const blocksRef = useRef(blocks);
  const baselineBlocksRef = useRef(baselineBlocks);
  const attachmentsRef = useRef(attachments);
  const baselineAttachmentsRef = useRef(baselineAttachments);
  const activeNoteIdRef = useRef(activeNoteId);
  const expectedUpdatedAtRef = useRef(expectedUpdatedAt);
  const activeFeatureIdRef = useRef(activeFeatureId);

  useEffect(() => {
    if (bootDraft && bootDraft.pendingFiles.size > 0) {
      restorePendingAttachmentFiles(bootDraft.pendingFiles);
    }
  }, [bootDraft]);

  const draftSetters = {
    setActiveNoteId,
    setBlocks: setBlocksState,
    setBaselineBlocks,
    setAttachments,
    setBaselineAttachments,
  };

  const applyDraft = (
    draft: FeatureNoteDraft,
    previousAttachments: readonly EditorNoteAttachment[],
  ) => {
    applyFeatureNoteDraftView({
      draft,
      previousAttachments,
      ...draftSetters,
    });
  };

  const applyEmptyEditor = (
    previousAttachments: readonly EditorNoteAttachment[],
    options?: { discardPendingFiles?: boolean },
  ) => {
    revokeEditorAttachmentUrls(previousAttachments);
    if (options?.discardPendingFiles) {
      clearLivePendingAttachmentFiles(
        pendingAttachmentIds(previousAttachments),
      );
    }
    const nextEmpty = createEmptyNoteDocument();
    setActiveNoteId(null);
    setExpectedUpdatedAt(null);
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
      captureFeatureNoteDraft({
        noteId,
        blocks: nextBlocks,
        baselineBlocks: nextBaselineBlocks,
        attachments: nextAttachments,
        baselineAttachments: nextBaselineAttachments,
      }),
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
    setHasLoadedNotes(false);
    setExpectedUpdatedAt(null);
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
    expectedUpdatedAtRef.current = expectedUpdatedAt;
  }, [expectedUpdatedAt]);
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
        setHasLoadedNotes(true);
        setError("Could not load notes.");
        return;
      }
      setNotes(next);
      setHasLoadedNotes(true);
      const currentId = activeNoteIdRef.current;
      if (currentId) {
        const match = next.find((note) => note.id === currentId);
        if (match) {
          setExpectedUpdatedAt(match.updatedAt);
        }
      }
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
      const match = notes.find((item) => item.id === noteId);
      setExpectedUpdatedAt(match?.updatedAt ?? null);
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
    setExpectedUpdatedAt(note.updatedAt);
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
        setExpectedUpdatedAt(null);
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

    startTransition(async () => {
      setError(null);
      const result = await persistFeatureNote({
        featureId: id,
        noteId: activeNoteIdRef.current,
        expectedUpdatedAt: expectedUpdatedAtRef.current,
        blocks: blocksRef.current,
        baselineBlocks: baselineBlocksRef.current,
        attachments: attachmentsRef.current,
        baselineAttachments: baselineAttachmentsRef.current,
      });

      if (!result.ok) {
        if (result.reason === "persist") {
          setError("Could not save note.");
        }
        return;
      }

      applySavedFeatureNote({
        saved: result.saved,
        setActiveNoteId,
        setBlocks: setBlocksState,
        setBaselineBlocks,
        setAttachments,
        setBaselineAttachments,
      });
      setExpectedUpdatedAt(result.saved.updatedAt);

      const refreshed = await refreshFeatureNotesList(id);
      if (refreshed === null) {
        setNotes((prev) => {
          const without = prev.filter((note) => note.id !== result.saved.id);
          return [result.saved, ...without];
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
      const ok = await removePersistedFeatureNote({ featureId: id, noteId });
      if (!ok) {
        setError("Could not delete note.");
        return;
      }
      applyEmptyEditor(attachmentsRef.current, { discardPendingFiles: true });
      const refreshed = await refreshFeatureNotesList(id);
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
        const next = await prepareFeatureNoteAttachment({ file, label });
        setAttachments((current) => [...current, next]);
        setError(null);
      } catch {
        setError("Could not prepare image.");
      }
    });
  };

  const removeAttachment = (attachmentId: string) => {
    const result = removeFeatureNoteAttachment({
      attachmentId,
      attachments: attachmentsRef.current,
      blocks: blocksRef.current,
    });
    if (!result) {
      return;
    }
    setAttachments(result.attachments);
    setBlocks(result.blocks);
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

    revokePendingEditorAttachments(attachmentsRef.current);
    clearLivePendingAttachmentFiles(
      pendingAttachmentIds(attachmentsRef.current),
    );

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
    hasLoadedNotes,
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
