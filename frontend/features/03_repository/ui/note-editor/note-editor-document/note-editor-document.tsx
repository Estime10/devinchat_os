"use client";

import {
  isNoteAttachmentRefText,
  noteAttachmentRefElementId,
} from "@/backend/features/04_features/domain/note-attachment/note-attachment";
import {
  numberedListLabel,
  type NoteBlock,
} from "@/backend/features/04_features/domain/note-block/note-block";
import type {
  ClipboardEvent as ReactClipboardEvent,
  KeyboardEvent as ReactKeyboardEvent,
  RefCallback,
} from "react";

type NoteEditorDocumentProps = {
  blocks: NoteBlock[];
  isDocumentEmpty: boolean;
  placeholder: string;
  registerBlockRef: (blockId: string) => RefCallback<HTMLDivElement>;
  onFocusBlock: (index: number) => void;
  onInput: (index: number, element: HTMLDivElement) => void;
  onPaste: (
    event: ReactClipboardEvent<HTMLDivElement>,
    index: number,
    element: HTMLDivElement,
  ) => void;
  onKeyDown: (
    event: ReactKeyboardEvent<HTMLDivElement>,
    index: number,
    element: HTMLDivElement,
  ) => void;
};

/**
 * Document contentEditable — blocs notes.
 */
export function NoteEditorDocument({
  blocks,
  isDocumentEmpty,
  placeholder,
  registerBlockRef,
  onFocusBlock,
  onInput,
  onPaste,
  onKeyDown,
}: NoteEditorDocumentProps) {
  return (
    <div className="note-editor" role="textbox" aria-multiline="true">
      {blocks.map((block, index) => {
        const showPlaceholder = isDocumentEmpty && index === 0;
        const isAttachmentRef = isNoteAttachmentRefText(block.text);
        return (
          <div
            key={block.id}
            id={
              isAttachmentRef
                ? noteAttachmentRefElementId(block.text.trim())
                : undefined
            }
            className={`note-block note-block--${block.type}${
              isAttachmentRef ? " note-block--attachment-ref" : ""
            }`}
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
                ref={registerBlockRef(block.id)}
                className="note-block-content"
                contentEditable
                suppressContentEditableWarning
                role="presentation"
                aria-label={showPlaceholder ? placeholder : undefined}
                onFocus={() => {
                  onFocusBlock(index);
                }}
                onInput={(event) => {
                  onInput(index, event.currentTarget);
                }}
                onPaste={(event) => {
                  onPaste(event, index, event.currentTarget);
                }}
                onKeyDown={(event) => {
                  onKeyDown(event, index, event.currentTarget);
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
