import type { NoteAttachment } from "@/backend/features/04_features/domain/note-attachment/note-attachment";
import type { NoteBlock } from "@/backend/features/04_features/domain/note-block/note-block";

export type OwnFeatureNote = {
  id: string;
  featureId: string;
  title: string;
  blocks: NoteBlock[];
  attachments: NoteAttachment[];
  updatedAt: string;
};
