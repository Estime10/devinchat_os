-- Attachments images sur feature_notes + bucket Storage

ALTER TABLE public.feature_notes
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.feature_notes
  DROP CONSTRAINT IF EXISTS feature_notes_attachments_is_array;

ALTER TABLE public.feature_notes
  ADD CONSTRAINT feature_notes_attachments_is_array
  CHECK (jsonb_typeof(attachments) = 'array');

COMMENT ON COLUMN public.feature_notes.attachments IS
  'Pièces jointes image — [{ id, path, url, name, mimeType, size }]';

-- Bucket privé aux écritures owner ; lecture publique des URLs (ébauches notes)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feature-note-attachments',
  'feature-note-attachments',
  true,
  5242880,
  ARRAY['image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Path : {auth.uid()}/{feature_id}/...
CREATE POLICY "feature_note_attachments_select"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'feature-note-attachments');

CREATE POLICY "feature_note_attachments_insert_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'feature-note-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "feature_note_attachments_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'feature-note-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'feature-note-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "feature_note_attachments_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'feature-note-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
