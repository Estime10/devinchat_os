"use client";

import type { EditorNoteAttachment } from "@/backend/features/04_features/domain/note-attachment/note-attachment";
import type { NoteBlock } from "@/backend/features/04_features/domain/note-block/note-block";
import { NoteEditorAttachments } from "@/frontend/features/03_repository/ui/note-editor/note-editor-attachments/note-editor-attachments";
import { NoteEditorDocument } from "@/frontend/features/03_repository/ui/note-editor/note-editor-document/note-editor-document";
import { NoteEditorToolbar } from "@/frontend/features/03_repository/ui/note-editor/note-editor-toolbar/note-editor-toolbar";
import { useNoteEditor } from "@/lib/hooks/repository/use-note-editor/use-note-editor";

type NoteEditorProps = {
  blocks: NoteBlock[];
  onChange: (blocks: NoteBlock[]) => void;
  attachments: EditorNoteAttachment[];
  onAddAttachment: (file: File, label: string) => void;
  onRemoveAttachment: (attachmentId: string) => void;
  attachmentsDisabled?: boolean;
  placeholder?: string;
};

/**
 * Orchestrateur éditeur notes — compose toolbar / attachments / document.
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
  const {
    activeType,
    isDocumentEmpty,
    registerBlockRef,
    setActiveIndex,
    handleInput,
    handlePaste,
    handleKeyDown,
    applyToolbarType,
    attachImage,
  } = useNoteEditor({
    blocks,
    onChange,
    onAddAttachment,
    attachmentLabels: attachments,
  });

  return (
    <div className="note-editor-shell">
      <NoteEditorToolbar
        activeType={activeType}
        attachmentsDisabled={attachmentsDisabled}
        onApplyType={applyToolbarType}
        onAttachImage={attachImage}
      />
      <NoteEditorAttachments
        attachments={attachments}
        disabled={attachmentsDisabled}
        onRemove={onRemoveAttachment}
      />
      <NoteEditorDocument
        blocks={blocks}
        isDocumentEmpty={isDocumentEmpty}
        placeholder={placeholder}
        registerBlockRef={registerBlockRef}
        onFocusBlock={setActiveIndex}
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
