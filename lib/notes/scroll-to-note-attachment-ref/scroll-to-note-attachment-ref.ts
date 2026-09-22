import { noteAttachmentRefElementId } from "@/backend/features/04_features/domain/note-attachment/note-attachment";

/**
 * Scroll + focus le bloc ref imageN dans l’éditeur.
 */
export function scrollToNoteAttachmentRef(label: string): void {
  const target = document.getElementById(noteAttachmentRefElementId(label));
  if (!target) {
    return;
  }
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  const editable = target.querySelector<HTMLElement>(".note-block-content");
  editable?.focus();
}
