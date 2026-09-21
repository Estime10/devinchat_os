"use client";

import { useEffect, useRef, useState } from "react";
import {
  createEmptyNoteDocument,
  hasNoteDocumentContent,
  type NoteBlock,
} from "@/backend/features/04_features/domain/note-block";
import {
  loadFeatureNotes,
  saveFeatureNotes,
} from "@/lib/notes/feature-notes-storage";

const SAVE_DEBOUNCE_MS = 280;

function loadBlocksForFeature(featureId: string | null): NoteBlock[] {
  return featureId ? loadFeatureNotes(featureId) : createEmptyNoteDocument();
}

/**
 * Notes d’une feature — état local + debounce localStorage.
 */
export function useFeatureNotes(featureId: string | null): {
  blocks: NoteBlock[];
  setBlocks: (blocks: NoteBlock[]) => void;
  hasContent: boolean;
  saveNow: () => void;
} {
  const [blocks, setBlocksState] = useState<NoteBlock[]>(() =>
    loadBlocksForFeature(featureId),
  );
  const [activeFeatureId, setActiveFeatureId] = useState(featureId);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const featureIdRef = useRef(featureId);
  const blocksRef = useRef(blocks);

  if (featureId !== activeFeatureId) {
    setActiveFeatureId(featureId);
    setBlocksState(loadBlocksForFeature(featureId));
  }

  useEffect(() => {
    featureIdRef.current = featureId;
  }, [featureId]);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const setBlocks = (next: NoteBlock[]) => {
    const id = featureIdRef.current;
    const safe = next.length > 0 ? next : createEmptyNoteDocument();
    setBlocksState(safe);

    if (!id) {
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveFeatureNotes(id, safe);
      saveTimerRef.current = null;
    }, SAVE_DEBOUNCE_MS);
  };

  const saveNow = () => {
    const id = featureIdRef.current;
    if (!id) {
      return;
    }
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    saveFeatureNotes(id, blocksRef.current);
  };

  return {
    blocks,
    setBlocks,
    hasContent: hasNoteDocumentContent(blocks),
    saveNow,
  };
}
