"use client";

import { X } from "lucide-react";
import type { EditorNoteAttachment } from "@/backend/features/04_features/domain/note-attachment/note-attachment";
import { Button } from "@/frontend/components/ui/button/button";
import { scrollToNoteAttachmentRef } from "@/lib/notes/scroll-to-note-attachment-ref/scroll-to-note-attachment-ref";

type NoteEditorAttachmentsProps = {
  attachments: EditorNoteAttachment[];
  disabled?: boolean;
  onRemove: (attachmentId: string) => void;
};

/**
 * Vignettes pièces jointes — scroll vers ref + remove.
 */
export function NoteEditorAttachments({
  attachments,
  disabled = false,
  onRemove,
}: NoteEditorAttachmentsProps) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <ul className="note-editor-attachments">
      {attachments.map((item) => (
        <li key={item.id} className="note-editor-attachment">
          <Button
            variant="bare"
            className="note-editor-attachment-anchor"
            title={`Go to ${item.label}`}
            aria-label={`Go to ${item.label} in note`}
            onClick={() => {
              scrollToNoteAttachmentRef(item.label);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt=""
              className="note-editor-attachment-image"
            />
            <span className="note-editor-attachment-label">{item.label}</span>
          </Button>
          <Button
            variant="bare"
            className="note-editor-attachment-remove"
            aria-label={`Remove ${item.label}`}
            disabled={disabled}
            onClick={() => {
              onRemove(item.id);
            }}
          >
            <X nonScalingStroke size={12} strokeWidth={2} />
          </Button>
        </li>
      ))}
    </ul>
  );
}
