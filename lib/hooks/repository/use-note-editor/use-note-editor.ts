"use client";

import {
  applyNoteBackspaceAtStart,
  applyNoteEnter,
  applyNoteInsertAttachmentRef,
  applyNotePaste,
  isEmptyNoteDocument,
  maybeConvertNoteShortcut,
  setNoteBlockType,
  updateNoteBlockText,
  type NoteBlock,
  type NoteBlockType,
  type NoteDocumentChange,
} from "@/backend/features/04_features/domain/note-block/note-block";
import { nextNoteAttachmentLabel } from "@/backend/features/04_features/domain/note-attachment/note-attachment";
import {
  getCaretOffset,
  isCollapsedSelectionIn,
  readBlockText,
  setCaretOffset,
  syncBlockElementText,
} from "@/lib/notes/note-editor-dom/note-editor-dom";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent as ReactClipboardEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefCallback,
} from "react";

type PendingFocus = {
  index: number;
  offset: number;
};

type HistoryEntry = {
  blocks: NoteBlock[];
  focusIndex: number;
  focusOffset: number;
};

const HISTORY_LIMIT = 100;

function cloneBlocks(blocks: readonly NoteBlock[]): NoteBlock[] {
  return blocks.map((block) => ({ ...block }));
}

function areBlocksEqual(
  a: readonly NoteBlock[],
  b: readonly NoteBlock[],
): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((block, index) => {
    const other = b[index];
    return (
      !!other &&
      block.id === other.id &&
      block.type === other.type &&
      block.text === other.text
    );
  });
}

/**
 * Orchestration éditeur notes — domaine + DOM, hors JSX.
 */
export function useNoteEditor(input: {
  blocks: NoteBlock[];
  onChange: (blocks: NoteBlock[]) => void;
  onAddAttachment: (file: File, label: string) => void;
  attachmentLabels: readonly { label: string }[];
}): {
  activeType: NoteBlockType;
  isDocumentEmpty: boolean;
  registerBlockRef: (blockId: string) => RefCallback<HTMLDivElement>;
  setActiveIndex: (index: number) => void;
  handleInput: (index: number, element: HTMLDivElement) => void;
  handlePaste: (
    event: ReactClipboardEvent<HTMLDivElement>,
    index: number,
    element: HTMLDivElement,
  ) => void;
  handleKeyDown: (
    event: ReactKeyboardEvent<HTMLDivElement>,
    index: number,
    element: HTMLDivElement,
  ) => void;
  applyToolbarType: (type: NoteBlockType) => void;
  attachImage: (file: File) => void;
} {
  const { blocks, onChange, onAddAttachment, attachmentLabels } = input;
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const blockRefCallbacks = useRef<Map<string, RefCallback<HTMLDivElement>>>(
    new Map(),
  );
  const pendingFocusRef = useRef<PendingFocus | null>(null);
  const blocksRef = useRef(blocks);
  const activeIndexRef = useRef(0);
  const historyRef = useRef<HistoryEntry[]>([]);
  const historyIndexRef = useRef(-1);
  const applyingHistoryRef = useRef(false);
  const localEditRef = useRef(false);
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

  useEffect(() => {
    if (localEditRef.current || applyingHistoryRef.current) {
      localEditRef.current = false;
      return;
    }
    historyRef.current = [
      {
        blocks: cloneBlocks(blocks),
        focusIndex: 0,
        focusOffset: 0,
      },
    ];
    historyIndexRef.current = 0;
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

  const recordHistory = (entry: HistoryEntry) => {
    if (applyingHistoryRef.current) {
      return;
    }
    const top = historyRef.current[historyIndexRef.current];
    if (
      top &&
      areBlocksEqual(top.blocks, entry.blocks) &&
      top.focusIndex === entry.focusIndex &&
      top.focusOffset === entry.focusOffset
    ) {
      return;
    }
    const next = historyRef.current.slice(0, historyIndexRef.current + 1);
    next.push({
      blocks: cloneBlocks(entry.blocks),
      focusIndex: entry.focusIndex,
      focusOffset: entry.focusOffset,
    });
    while (next.length > HISTORY_LIMIT) {
      next.shift();
    }
    historyRef.current = next;
    historyIndexRef.current = next.length - 1;
  };

  const snapshotCurrent = (element?: HTMLDivElement | null): HistoryEntry => {
    const index = activeIndexRef.current;
    const block = blocksRef.current[index];
    const focused = block ? blockRefs.current.get(block.id) : null;
    const target = element ?? focused;
    return {
      blocks: cloneBlocks(blocksRef.current),
      focusIndex: index,
      focusOffset: target ? getCaretOffset(target) : 0,
    };
  };

  const emitChange = (nextBlocks: NoteBlock[]) => {
    localEditRef.current = true;
    onChange(nextBlocks);
  };

  const commitChange = (change: NoteDocumentChange) => {
    recordHistory({
      blocks: change.blocks,
      focusIndex: change.focusIndex,
      focusOffset: change.focusOffset,
    });
    pendingFocusRef.current = {
      index: change.focusIndex,
      offset: change.focusOffset,
    };
    emitChange(change.blocks);
  };

  const applyHistoryEntry = (entry: HistoryEntry) => {
    applyingHistoryRef.current = true;
    pendingFocusRef.current = {
      index: entry.focusIndex,
      offset: entry.focusOffset,
    };
    onChange(cloneBlocks(entry.blocks));
    Promise.resolve().then(() => {
      applyingHistoryRef.current = false;
    });
  };

  const undo = (element: HTMLDivElement) => {
    const current = snapshotCurrent(element);
    const top = historyRef.current[historyIndexRef.current];
    if (!top || !areBlocksEqual(top.blocks, current.blocks)) {
      recordHistory(current);
    }
    if (historyIndexRef.current <= 0) {
      return;
    }
    historyIndexRef.current -= 1;
    const entry = historyRef.current[historyIndexRef.current];
    if (entry) {
      applyHistoryEntry(entry);
    }
  };

  const redo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) {
      return;
    }
    historyIndexRef.current += 1;
    const entry = historyRef.current[historyIndexRef.current];
    if (entry) {
      applyHistoryEntry(entry);
    }
  };

  const setActiveIndex = (index: number) => {
    activeIndexRef.current = index;
    setActiveIndexState(index);
  };

  const registerBlockRef = (blockId: string): RefCallback<HTMLDivElement> => {
    const existing = blockRefCallbacks.current.get(blockId);
    if (existing) {
      return existing;
    }
    const callback: RefCallback<HTMLDivElement> = (node) => {
      if (node) {
        blockRefs.current.set(blockId, node);
      } else {
        blockRefs.current.delete(blockId);
      }
    };
    blockRefCallbacks.current.set(blockId, callback);
    return callback;
  };

  const handleInput = (index: number, element: HTMLDivElement) => {
    const text = readBlockText(element);
    const currentBlocks = blocksRef.current;
    const converted = maybeConvertNoteShortcut(currentBlocks, index, text);
    if (converted) {
      element.innerText = converted.blocks[index]?.text ?? "";
      commitChange(converted);
      return;
    }
    const nextBlocks = updateNoteBlockText(currentBlocks, index, text);
    recordHistory({
      blocks: nextBlocks,
      focusIndex: index,
      focusOffset: getCaretOffset(element),
    });
    emitChange(nextBlocks);
  };

  const handlePaste = (
    event: ReactClipboardEvent<HTMLDivElement>,
    index: number,
    element: HTMLDivElement,
  ) => {
    const pasted = event.clipboardData.getData("text/plain");
    if (!pasted) {
      return;
    }
    event.preventDefault();
    const change = applyNotePaste(
      blocksRef.current,
      index,
      getCaretOffset(element),
      pasted,
    );
    if (change) {
      commitChange(change);
    }
  };

  const handleKeyDown = (
    event: ReactKeyboardEvent<HTMLDivElement>,
    index: number,
    element: HTMLDivElement,
  ) => {
    const currentBlocks = blocksRef.current;
    const mod = event.metaKey || event.ctrlKey;

    if (mod && event.key.toLowerCase() === "z" && !event.altKey) {
      event.preventDefault();
      if (event.shiftKey) {
        redo();
      } else {
        undo(element);
      }
      return;
    }

    if (mod && event.key.toLowerCase() === "y" && !event.altKey) {
      event.preventDefault();
      redo();
      return;
    }

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

  const insertAttachmentRef = (label: string) => {
    const index = activeIndexRef.current;
    const block = blocksRef.current[index];
    const element = block ? blockRefs.current.get(block.id) : null;
    const offset = element
      ? getCaretOffset(element)
      : (block?.text.length ?? 0);
    const change = applyNoteInsertAttachmentRef(
      blocksRef.current,
      index,
      offset,
      label,
    );
    if (change) {
      commitChange(change);
    }
  };

  const attachImage = (file: File) => {
    const label = nextNoteAttachmentLabel(attachmentLabels);
    onAddAttachment(file, label);
    insertAttachmentRef(label);
  };

  return {
    activeType: blocks[safeActiveIndex]?.type ?? "paragraph",
    isDocumentEmpty: isEmptyNoteDocument(blocks),
    registerBlockRef,
    setActiveIndex,
    handleInput,
    handlePaste,
    handleKeyDown,
    applyToolbarType,
    attachImage,
  };
}
