"use client";

import {
  areNoteAttachmentsEqual,
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
  uploadOwnFeatureNoteAttachmentAction,
} from "@/backend/features/04_features/mutations/feature-notes";
import { useEffect, useRef, useState, useTransition } from "react";

function cloneBlocks(blocks: readonly NoteBlock[]): NoteBlock[] {
  return blocks.map((block) => ({ ...block }));
}

function cloneAttachments(
  attachments: readonly NoteAttachment[],
): NoteAttachment[] {
  return attachments.map((item) => ({ ...item }));
}

/**
 * Notes DB d’une feature — texte + pièces jointes image.
 */
export function useFeatureNotes(featureId: string | null): {
  blocks: NoteBlock[];
  setBlocks: (blocks: NoteBlock[]) => void;
  attachments: NoteAttachment[];
  notes: OwnFeatureNote[];
  activeNoteId: string | null;
  canSave: boolean;
  canDelete: boolean;
  canStartNew: boolean;
  isPending: boolean;
  selectNote: (noteId: string) => void;
  startNewNote: () => void;
  saveNote: () => Promise<void>;
  deleteNote: () => Promise<void>;
  addAttachment: (file: File) => Promise<void>;
  removeAttachment: (attachmentId: string) => Promise<void>;
} {
  const empty = createEmptyNoteDocument();
  const [blocks, setBlocksState] = useState<NoteBlock[]>(() => empty);
  const [baselineBlocks, setBaselineBlocks] = useState<NoteBlock[]>(() =>
    cloneBlocks(empty),
  );
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);
  const [baselineAttachments, setBaselineAttachments] = useState<
    NoteAttachment[]
  >([]);
  const [notes, setNotes] = useState<OwnFeatureNote[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeFeatureId, setActiveFeatureId] = useState(featureId);
  const [isPending, startTransition] = useTransition();
  const blocksRef = useRef(blocks);
  const attachmentsRef = useRef(attachments);
  const activeNoteIdRef = useRef(activeNoteId);

  if (featureId !== activeFeatureId) {
    const nextEmpty = createEmptyNoteDocument();
    setActiveFeatureId(featureId);
    setBlocksState(nextEmpty);
    setBaselineBlocks(cloneBlocks(nextEmpty));
    setAttachments([]);
    setBaselineAttachments([]);
    setNotes([]);
    setActiveNoteId(null);
  }

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    activeNoteIdRef.current = activeNoteId;
  }, [activeNoteId]);

  useEffect(() => {
    if (!featureId) {
      return;
    }
    let cancelled = false;
    startTransition(async () => {
      const next = await listOwnFeatureNotesAction(featureId);
      if (!cancelled) {
        setNotes(next);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [featureId]);

  const setBlocks = (next: NoteBlock[]) => {
    setBlocksState(next.length > 0 ? next : createEmptyNoteDocument());
  };

  const selectNote = (noteId: string) => {
    const note = notes.find((item) => item.id === noteId);
    if (!note) {
      return;
    }
    const nextBlocks =
      note.blocks.length > 0 ? note.blocks : createEmptyNoteDocument();
    setActiveNoteId(note.id);
    setBlocksState(nextBlocks);
    setBaselineBlocks(cloneBlocks(nextBlocks));
    setAttachments(cloneAttachments(note.attachments));
    setBaselineAttachments(cloneAttachments(note.attachments));
  };

  const startNewNote = () => {
    const nextEmpty = createEmptyNoteDocument();
    setActiveNoteId(null);
    setBlocksState(nextEmpty);
    setBaselineBlocks(cloneBlocks(nextEmpty));
    setAttachments([]);
    setBaselineAttachments([]);
  };

  const saveNote = async () => {
    const id = featureId;
    if (!id) {
      return;
    }
    const hasText = hasNoteDocumentContent(blocksRef.current);
    const hasFiles = attachmentsRef.current.length > 0;
    if (!hasText && !hasFiles) {
      return;
    }
    const dirtyText = isNoteDocumentDirty(blocksRef.current, baselineBlocks);
    const dirtyFiles = !areNoteAttachmentsEqual(
      attachmentsRef.current,
      baselineAttachments,
    );
    if (!dirtyText && !dirtyFiles) {
      return;
    }

    startTransition(async () => {
      const nextAttachments = attachmentsRef.current;
      const removedFromBaseline = baselineAttachments.filter(
        (item) => !nextAttachments.some((current) => current.id === item.id),
      );

      const saved = await saveOwnFeatureNoteAction({
        featureId: id,
        noteId: activeNoteIdRef.current,
        blocks: blocksRef.current,
        attachments: nextAttachments,
      });
      if (!saved) {
        return;
      }

      if (removedFromBaseline.length > 0) {
        await Promise.all(
          removedFromBaseline.map((item) =>
            removeOwnFeatureNoteAttachmentAction({ path: item.path }),
          ),
        );
      }

      setActiveNoteId(saved.id);
      setBlocksState(saved.blocks);
      setBaselineBlocks(cloneBlocks(saved.blocks));
      setAttachments(cloneAttachments(saved.attachments));
      setBaselineAttachments(cloneAttachments(saved.attachments));
      const refreshed = await listOwnFeatureNotesAction(id);
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
      const ok = await deleteOwnFeatureNoteAction({ featureId: id, noteId });
      if (!ok) {
        return;
      }
      const nextEmpty = createEmptyNoteDocument();
      setActiveNoteId(null);
      setBlocksState(nextEmpty);
      setBaselineBlocks(cloneBlocks(nextEmpty));
      setAttachments([]);
      setBaselineAttachments([]);
      const refreshed = await listOwnFeatureNotesAction(id);
      setNotes(refreshed);
    });
  };

  const addAttachment = async (file: File) => {
    const id = featureId;
    if (!id) {
      return;
    }

    startTransition(async () => {
      try {
        const { convertImageFileToWebp } =
          await import("@/lib/notes/convert-image-to-webp");
        const webpFile = await convertImageFileToWebp(file);
        const formData = new FormData();
        formData.set("file", webpFile);
        const uploaded = await uploadOwnFeatureNoteAttachmentAction({
          featureId: id,
          noteId: activeNoteIdRef.current,
          formData,
        });
        if (!uploaded) {
          return;
        }
        setAttachments((current) => [...current, uploaded]);
      } catch {
        // Conversion / upload échoué — pas de partial state.
      }
    });
  };

  const removeAttachment = async (attachmentId: string) => {
    const target = attachmentsRef.current.find(
      (item) => item.id === attachmentId,
    );
    if (!target) {
      return;
    }

    // Déjà en DB → retrait local seulement ; purge storage au save.
    // Draft non sauvé → purge immédiate pour éviter les orphelins.
    const wasPersisted = baselineAttachments.some(
      (item) => item.id === attachmentId,
    );
    setAttachments((current) =>
      current.filter((item) => item.id !== attachmentId),
    );
    if (!wasPersisted) {
      startTransition(async () => {
        await removeOwnFeatureNoteAttachmentAction({ path: target.path });
      });
    }
  };

  const hasContent = hasNoteDocumentContent(blocks) || attachments.length > 0;
  const isDirty =
    isNoteDocumentDirty(blocks, baselineBlocks) ||
    !areNoteAttachmentsEqual(attachments, baselineAttachments);
  const isPersisted = activeNoteId !== null;

  return {
    blocks,
    setBlocks,
    attachments,
    notes,
    activeNoteId,
    canSave: hasContent && isDirty,
    canDelete: isPersisted,
    canStartNew: isPersisted || notes.length > 0,
    isPending,
    selectNote,
    startNewNote,
    saveNote,
    deleteNote,
    addAttachment,
    removeAttachment,
  };
}
