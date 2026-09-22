"use client";

import { Heading, List, ListOrdered, Paperclip, Type } from "lucide-react";
import {
  NOTE_FORMAT_ACTIONS,
  type NoteBlockType,
} from "@/backend/features/04_features/domain/note-block/note-block";
import { NOTE_ATTACHMENT_INPUT_MIME_TYPES } from "@/backend/features/04_features/domain/note-attachment/note-attachment";
import { Button } from "@/frontend/components/ui/button/button";
import type { LucideIcon } from "lucide-react";
import { useRef } from "react";

const FORMAT_ICONS: Record<NoteBlockType, LucideIcon> = {
  paragraph: Type,
  heading: Heading,
  bullet: List,
  numbered: ListOrdered,
};

type NoteEditorToolbarProps = {
  activeType: NoteBlockType;
  attachmentsDisabled?: boolean;
  onApplyType: (type: NoteBlockType) => void;
  onAttachImage: (file: File) => void;
};

/**
 * Toolbar format + attach — présentation pure.
 */
export function NoteEditorToolbar({
  activeType,
  attachmentsDisabled = false,
  onApplyType,
  onAttachImage,
}: NoteEditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
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
          <Button
            key={action.type}
            variant="toolbar"
            aria-label={`${action.label}, shortcut ${action.shortcut}`}
            aria-pressed={pressed}
            title={`${action.label} (${action.shortcut})`}
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onClick={() => {
              onApplyType(action.type);
            }}
          >
            <Icon nonScalingStroke size={15} strokeWidth={1.75} />
            <span className="note-editor-toolbar-label">{action.label}</span>
            <kbd className="note-editor-toolbar-shortcut">
              {action.shortcut}
            </kbd>
          </Button>
        );
      })}

      <Button
        variant="toolbar"
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
      </Button>
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
          onAttachImage(file);
        }}
      />
    </div>
  );
}
