-- Bucket notes : privé + SELECT owner-only (plus de listabilité publique).

UPDATE storage.buckets
SET public = false
WHERE id = 'feature-note-attachments';

DROP POLICY IF EXISTS "feature_note_attachments_select" ON storage.objects;

CREATE POLICY "feature_note_attachments_select_own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'feature-note-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
