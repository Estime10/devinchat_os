"use client";

import {
  applyNoteBackspaceAtStart,
  applyNoteEnter,
  isEmptyNoteDocument,
  maybeConvertNoteShortcut,
  setNoteBlockType,
  updateNoteBlockText,
  type NoteBlock,
  type NoteBlockType,
  type NoteDocumentChange,
} from "@/backend/features/04_features/domain/note-block";
import {
  getCaretOffset,
  isCollapsedSelectionIn,
  readBlockText,
  setCaretOffset,
  syncBlockElementText,
} from "@/lib/notes/note-editor-dom";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefCallback,
} from "react";

type PendingFocus = {
  index: number;
  offset: number;
};

/**
 * Orchestration éditeur notes — domaine + DOM, hors JSX.
 */
export function useNoteEditor(input: {
  blocks: NoteBlock[];
  onChange: (blocks: NoteBlock[]) => void;
}): {
  activeType: NoteBlockType;
  isDocumentEmpty: boolean;
  registerBlockRef: (
    blockId: string,
    text: string,
  ) => RefCallback<HTMLDivElement>;
  setActiveIndex: (index: number) => void;
  handleInput: (index: number, element: HTMLDivElement) => void;
  handleKeyDown: (
    event: ReactKeyboardEvent<HTMLDivElement>,
    index: number,
    element: HTMLDivElement,
  ) => void;
  applyToolbarType: (type: NoteBlockType) => void;
} {
  const { blocks, onChange } = input;
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const pendingFocusRef = useRef<PendingFocus | null>(null);
  const blocksRef = useRef(blocks);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndexState] = useState(0);

  const maxIndex = Math.max(0, blocks.length - 1);
  const safeActiveIndex = Math.min(activeIndex, maxIndex);
  if (safeActiveIndex !== activeIndex) {
    setActiveIndexState(safeActiveIndex);
  }

  useEffect(() => {
    activeIndexRef.current = safeActiveIndex;
  }, [safeActiveIndex]);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useLayoutEffect(() => {
    for (const block of blocks) {
      const element = blockRefs.current.get(block.id);
      if (!element || document.activeElement === element) {
        continue;
      }
      syncBlockElementText(element, block.text);
    }

    const pending = pendingFocusRef.current;
    if (!pending) {
      return;
    }
    const target = blocks[pending.index];
    if (!target) {
      pendingFocusRef.current = null;
      return;
    }
    const element = blockRefs.current.get(target.id);
    if (!element) {
      return;
    }
    syncBlockElementText(element, target.text);
    element.focus();
    setCaretOffset(element, pending.offset);
    activeIndexRef.current = pending.index;
    setActiveIndexState(pending.index);
    pendingFocusRef.current = null;
  }, [blocks]);

  const commitChange = (change: NoteDocumentChange) => {
    pendingFocusRef.current = {
      index: change.focusIndex,
      offset: change.focusOffset,
    };
    onChange(change.blocks);
  };

  const setActiveIndex = (index: number) => {
    activeIndexRef.current = index;
    setActiveIndexState(index);
  };

  const registerBlockRef =
    (blockId: string, text: string): RefCallback<HTMLDivElement> =>
    (node) => {
      if (node) {
        blockRefs.current.set(blockId, node);
        syncBlockElementText(node, text);
      } else {
        blockRefs.current.delete(blockId);
      }
    };

  const handleInput = (index: number, element: HTMLDivElement) => {
    const text = readBlockText(element);
    const currentBlocks = blocksRef.current;
    const converted = maybeConvertNoteShortcut(currentBlocks, index, text);
    if (converted) {
      const nextText = converted.blocks[index]?.text ?? "";
      element.innerText = nextText;
      commitChange(converted);
      return;
    }
    onChange(updateNoteBlockText(currentBlocks, index, text));
  };

  const handleKeyDown = (
    event: ReactKeyboardEvent<HTMLDivElement>,
    index: number,
    element: HTMLDivElement,
  ) => {
    const currentBlocks = blocksRef.current;

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const change = applyNoteEnter(
        currentBlocks,
        index,
        getCaretOffset(element),
      );
      if (change) {
        commitChange(change);
      }
      return;
    }

    if (event.key === "Backspace") {
      if (!isCollapsedSelectionIn(element)) {
        return;
      }
      if (getCaretOffset(element) === 0) {
        event.preventDefault();
        const change = applyNoteBackspaceAtStart(currentBlocks, index);
        if (change) {
          commitChange(change);
        }
      }
    }
  };

  const applyToolbarType = (type: NoteBlockType) => {
    const index = activeIndexRef.current;
    const change = setNoteBlockType(blocksRef.current, index, type);
    if (change) {
      commitChange(change);
      return;
    }
    const block = blocksRef.current[index];
    const element = block ? blockRefs.current.get(block.id) : null;
    element?.focus();
  };

  return {
    activeType: blocks[safeActiveIndex]?.type ?? "paragraph",
    isDocumentEmpty: isEmptyNoteDocument(blocks),
    registerBlockRef,
    setActiveIndex,
    handleInput,
    handleKeyDown,
    applyToolbarType,
  };
}
