"use client";

import { Heading, List, ListOrdered, Paperclip, Type, X } from "lucide-react";
import {
  isNoteAttachmentRefText,
  nextNoteAttachmentLabel,
  noteAttachmentRefElementId,
  NOTE_ATTACHMENT_INPUT_MIME_TYPES,
  type EditorNoteAttachment,
} from "@/backend/features/04_features/domain/note-attachment";
import {
  NOTE_FORMAT_ACTIONS,
  numberedListLabel,
  type NoteBlock,
  type NoteBlockType,
} from "@/backend/features/04_features/domain/note-block";
import { useNoteEditor } from "@/lib/hooks/repository/use-note-editor";
import type { LucideIcon } from "lucide-react";
import { useRef } from "react";

type NoteEditorProps = {
  blocks: NoteBlock[];
  onChange: (blocks: NoteBlock[]) => void;
  attachments: EditorNoteAttachment[];
  onAddAttachment: (file: File, label: string) => void;
  onRemoveAttachment: (attachmentId: string) => void;
  attachmentsDisabled?: boolean;
  placeholder?: string;
};

const FORMAT_ICONS: Record<NoteBlockType, LucideIcon> = {
  paragraph: Type,
  heading: Heading,
  bullet: List,
  numbered: ListOrdered,
};

function scrollToAttachmentRef(label: string): void {
  const target = document.getElementById(noteAttachmentRefElementId(label));
  if (!target) {
    return;
  }
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  const editable = target.querySelector<HTMLElement>(".note-block-content");
  editable?.focus();
}

/**
 * Présentation éditeur notes — texte + pièces jointes.
 */
export function NoteEditor({
  blocks,
  onChange,
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  attachmentsDisabled = false,
  placeholder = "Write a note…",
}: NoteEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    activeType,
    isDocumentEmpty,
    registerBlockRef,
    setActiveIndex,
    handleInput,
    handlePaste,
    handleKeyDown,
    applyToolbarType,
    insertAttachmentRef,
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

        <button
          type="button"
          className="note-editor-toolbar-btn"
          aria-label="Attach image"
          title="Attach image"
          disabled={attachmentsDisabled}
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onClick={() => {
            fileInputRef.current?.click();
          }}
        >
          <Paperclip nonScalingStroke size={15} strokeWidth={1.75} />
          <span className="note-editor-toolbar-label">Attach</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={NOTE_ATTACHMENT_INPUT_MIME_TYPES.join(",")}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) {
              return;
            }
            const label = nextNoteAttachmentLabel(attachments);
            onAddAttachment(file, label);
            insertAttachmentRef(label);
          }}
        />
      </div>

      {attachments.length > 0 ? (
        <ul className="note-editor-attachments">
          {attachments.map((item) => (
            <li key={item.id} className="note-editor-attachment">
              <button
                type="button"
                className="note-editor-attachment-anchor"
                title={`Go to ${item.label}`}
                aria-label={`Go to ${item.label} in note`}
                onClick={() => {
                  scrollToAttachmentRef(item.label);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt=""
                  className="note-editor-attachment-image"
                />
                <span className="note-editor-attachment-label">
                  {item.label}
                </span>
              </button>
              <button
                type="button"
                className="note-editor-attachment-remove"
                aria-label={`Remove ${item.label}`}
                disabled={attachmentsDisabled}
                onClick={() => {
                  onRemoveAttachment(item.id);
                }}
              >
                <X nonScalingStroke size={12} strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

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
                    setActiveIndex(index);
                  }}
                  onInput={(event) => {
                    handleInput(index, event.currentTarget);
                  }}
                  onPaste={(event) => {
                    handlePaste(event, index, event.currentTarget);
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
