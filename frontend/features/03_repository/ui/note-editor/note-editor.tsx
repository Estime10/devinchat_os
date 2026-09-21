"use client";

import { Heading, List, ListOrdered, Type } from "lucide-react";
import {
  NOTE_FORMAT_ACTIONS,
  numberedListLabel,
  type NoteBlock,
  type NoteBlockType,
} from "@/backend/features/04_features/domain/note-block";
import { useNoteEditor } from "@/lib/hooks/repository/use-note-editor";
import type { LucideIcon } from "lucide-react";

type NoteEditorProps = {
  blocks: NoteBlock[];
  onChange: (blocks: NoteBlock[]) => void;
  placeholder?: string;
};

const FORMAT_ICONS: Record<NoteBlockType, LucideIcon> = {
  paragraph: Type,
  heading: Heading,
  bullet: List,
  numbered: ListOrdered,
};

/**
 * Présentation éditeur notes — logique dans useNoteEditor.
 */
export function NoteEditor({
  blocks,
  onChange,
  placeholder = "Write a note…",
}: NoteEditorProps) {
  const {
    activeType,
    isDocumentEmpty,
    registerBlockRef,
    setActiveIndex,
    handleInput,
    handleKeyDown,
    applyToolbarType,
  } = useNoteEditor({ blocks, onChange });

  return (
    <div className="note-editor-shell">
      <div
        className="note-editor-toolbar"
        role="toolbar"
        aria-label="Note format"
      >
        {NOTE_FORMAT_ACTIONS.map((action) => {
          const Icon = FORMAT_ICONS[action.type];
          const pressed =
            action.type === "paragraph"
              ? activeType === "paragraph"
              : activeType === action.type;
          return (
            <button
              key={action.type}
              type="button"
              className="note-editor-toolbar-btn"
              aria-label={`${action.label}, shortcut ${action.shortcut}`}
              aria-pressed={pressed}
              title={`${action.label} (${action.shortcut})`}
              onMouseDown={(event) => {
                event.preventDefault();
              }}
              onClick={() => {
                applyToolbarType(action.type);
              }}
            >
              <Icon nonScalingStroke size={15} strokeWidth={1.75} />
              <span className="note-editor-toolbar-label">{action.label}</span>
              <kbd className="note-editor-toolbar-shortcut">
                {action.shortcut}
              </kbd>
            </button>
          );
        })}
      </div>

      <div className="note-editor" role="textbox" aria-multiline="true">
        {blocks.map((block, index) => {
          const showPlaceholder = isDocumentEmpty && index === 0;
          return (
            <div
              key={block.id}
              className={`note-block note-block--${block.type}`}
              data-numbered={
                block.type === "numbered"
                  ? String(numberedListLabel(blocks, index))
                  : undefined
              }
            >
              <div className="note-block-body">
                {showPlaceholder ? (
                  <span className="note-block-placeholder" aria-hidden>
                    {placeholder}
                  </span>
                ) : null}
                <div
                  ref={registerBlockRef(block.id, block.text)}
                  className="note-block-content"
                  contentEditable
                  suppressContentEditableWarning
                  role="presentation"
                  aria-label={showPlaceholder ? placeholder : undefined}
                  onFocus={() => {
                    setActiveIndex(index);
                  }}
                  onInput={(event) => {
                    handleInput(index, event.currentTarget);
                  }}
                  onKeyDown={(event) => {
                    handleKeyDown(event, index, event.currentTarget);
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
