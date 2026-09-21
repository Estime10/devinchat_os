-- Notes de feature (N notes par branche/feature) — body = blocs JSON éditeur

CREATE TABLE IF NOT EXISTS public.feature_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id uuid NOT NULL REFERENCES public.features (id) ON DELETE CASCADE,
  title text NOT NULL,
  body jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feature_notes_title_not_blank CHECK (char_length(trim(title)) > 0),
  CONSTRAINT feature_notes_body_is_array CHECK (jsonb_typeof(body) = 'array')
);

COMMENT ON TABLE public.feature_notes IS
  'Notes utilisateur liées à une feature/branche — N notes par feature';

CREATE INDEX IF NOT EXISTS idx_feature_notes_feature_id_updated_at
  ON public.feature_notes (feature_id, updated_at DESC);

CREATE TRIGGER feature_notes_set_updated_at
BEFORE UPDATE ON public.feature_notes
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.feature_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feature_notes_select_own"
ON public.feature_notes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.features f
    JOIN public.projects p ON p.id = f.project_id
    WHERE f.id = feature_notes.feature_id
      AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "feature_notes_insert_own"
ON public.feature_notes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.features f
    JOIN public.projects p ON p.id = f.project_id
    WHERE f.id = feature_notes.feature_id
      AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "feature_notes_update_own"
ON public.feature_notes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.features f
    JOIN public.projects p ON p.id = f.project_id
    WHERE f.id = feature_notes.feature_id
      AND p.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.features f
    JOIN public.projects p ON p.id = f.project_id
    WHERE f.id = feature_notes.feature_id
      AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "feature_notes_delete_own"
ON public.feature_notes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.features f
    JOIN public.projects p ON p.id = f.project_id
    WHERE f.id = feature_notes.feature_id
      AND p.owner_id = auth.uid()
  )
);
