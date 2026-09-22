import {
  createNoteAttachmentId,
  NOTE_ATTACHMENT_BUCKET,
  NOTE_ATTACHMENT_MAX_BYTES,
  NOTE_ATTACHMENT_SIGNED_URL_TTL_SECONDS,
  NOTE_ATTACHMENT_STORED_MIME,
  type NoteAttachment,
} from "@/backend/features/04_features/domain/note-attachment/note-attachment";
import { isWebpBytes } from "@/lib/notes/is-webp-bytes/is-webp-bytes";
import { createClient } from "@/lib/supabase/server/server";

function sanitizeFileName(name: string): string {
  const withoutExt = name.replace(/\.[^.]+$/, "");
  const base = withoutExt.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 80);
  return base.length > 0 ? base : "image";
}

function toStoredAttachment(attachment: NoteAttachment): NoteAttachment {
  return {
    ...attachment,
    url: "",
  };
}

/**
 * Régénère des URLs signées (bucket privé) — ne jamais exposer getPublicUrl.
 */
export async function signOwnFeatureNoteAttachmentUrls(
  attachments: readonly NoteAttachment[],
): Promise<NoteAttachment[]> {
  if (attachments.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const signed: NoteAttachment[] = [];

  for (const item of attachments) {
    const { data, error } = await supabase.storage
      .from(NOTE_ATTACHMENT_BUCKET)
      .createSignedUrl(item.path, NOTE_ATTACHMENT_SIGNED_URL_TTL_SECONDS);

    signed.push({
      ...item,
      url: error || !data?.signedUrl ? "" : data.signedUrl,
    });
  }

  return signed;
}

/**
 * Upload une image WebP dans le bucket notes (noteId obligatoire — pas de draft).
 * Valide Content-Type + magic bytes RIFF/WEBP.
 */
export async function uploadOwnFeatureNoteAttachment(input: {
  featureId: string;
  noteId: string;
  file: File;
  attachmentId?: string;
  label?: string;
}): Promise<NoteAttachment | null> {
  if (input.file.type !== NOTE_ATTACHMENT_STORED_MIME) {
    return null;
  }
  if (input.file.size <= 0 || input.file.size > NOTE_ATTACHMENT_MAX_BYTES) {
    return null;
  }

  const bytes = new Uint8Array(await input.file.arrayBuffer());
  if (!isWebpBytes(bytes)) {
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

  const attachmentId = input.attachmentId ?? createNoteAttachmentId();
  const safeName = sanitizeFileName(input.file.name);
  const path = `${user.id}/${input.featureId}/${input.noteId}/${attachmentId}-${safeName}.webp`;

  const { error: uploadError } = await supabase.storage
    .from(NOTE_ATTACHMENT_BUCKET)
    .upload(path, bytes, {
      contentType: NOTE_ATTACHMENT_STORED_MIME,
      upsert: false,
    });

  if (uploadError) {
    return null;
  }

  return {
    id: attachmentId,
    path,
    url: "",
    name: `${safeName}.webp`,
    mimeType: NOTE_ATTACHMENT_STORED_MIME,
    size: input.file.size,
    label: input.label ?? "image1",
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

/**
 * GC orphelins d’un dossier note : objets storage absents de keptPaths.
 * Best-effort — échec list/remove ignoré.
 */
export async function garbageCollectOwnFeatureNoteAttachmentFolder(input: {
  userId: string;
  featureId: string;
  noteId: string;
  keptPaths: readonly string[];
}): Promise<void> {
  const folder = `${input.userId}/${input.featureId}/${input.noteId}`;
  const kept = new Set(input.keptPaths);
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(NOTE_ATTACHMENT_BUCKET)
    .list(folder, { limit: 100 });

  if (error || !data) {
    return;
  }

  const orphans = data
    .map((item) => item.name)
    .filter((name) => typeof name === "string" && name.length > 0)
    .map((name) => `${folder}/${name}`)
    .filter((path) => !kept.has(path));

  await removeOwnFeatureNoteAttachmentFiles(orphans);
}

export { toStoredAttachment };
