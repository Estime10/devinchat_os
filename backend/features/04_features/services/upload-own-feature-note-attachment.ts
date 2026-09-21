import {
  createNoteAttachmentId,
  NOTE_ATTACHMENT_BUCKET,
  NOTE_ATTACHMENT_MAX_BYTES,
  NOTE_ATTACHMENT_STORED_MIME,
  type NoteAttachment,
} from "@/backend/features/04_features/domain/note-attachment";
import { createClient } from "@/lib/supabase/server";

function sanitizeFileName(name: string): string {
  const withoutExt = name.replace(/\.[^.]+$/, "");
  const base = withoutExt.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 80);
  return base.length > 0 ? base : "image";
}

/**
 * Upload une image WebP dans le bucket notes (path owner-scoped).
 */
export async function uploadOwnFeatureNoteAttachment(input: {
  featureId: string;
  noteId?: string | null;
  file: File;
}): Promise<NoteAttachment | null> {
  if (input.file.type !== NOTE_ATTACHMENT_STORED_MIME) {
    return null;
  }
  if (input.file.size <= 0 || input.file.size > NOTE_ATTACHMENT_MAX_BYTES) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: feature, error: featureError } = await supabase
    .from("features")
    .select("id")
    .eq("id", input.featureId)
    .maybeSingle();
  if (featureError || !feature) {
    return null;
  }

  const attachmentId = createNoteAttachmentId();
  const safeName = sanitizeFileName(input.file.name);
  const scope = input.noteId ?? "draft";
  const path = `${user.id}/${input.featureId}/${scope}/${attachmentId}-${safeName}.webp`;

  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(NOTE_ATTACHMENT_BUCKET)
    .upload(path, bytes, {
      contentType: NOTE_ATTACHMENT_STORED_MIME,
      upsert: false,
    });

  if (uploadError) {
    return null;
  }

  const { data: publicUrl } = supabase.storage
    .from(NOTE_ATTACHMENT_BUCKET)
    .getPublicUrl(path);

  return {
    id: attachmentId,
    path,
    url: publicUrl.publicUrl,
    name: `${safeName}.webp`,
    mimeType: NOTE_ATTACHMENT_STORED_MIME,
    size: input.file.size,
  };
}

/**
 * Supprime des fichiers storage (best-effort).
 */
export async function removeOwnFeatureNoteAttachmentFiles(
  paths: readonly string[],
): Promise<void> {
  if (paths.length === 0) {
    return;
  }
  const supabase = await createClient();
  await supabase.storage.from(NOTE_ATTACHMENT_BUCKET).remove([...paths]);
}
