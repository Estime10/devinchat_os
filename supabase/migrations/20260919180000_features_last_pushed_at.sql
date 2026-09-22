-- last_pushed_at : tip commit date pour ordre d’affichage des features

ALTER TABLE public.features
  ADD COLUMN IF NOT EXISTS last_pushed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_features_project_last_pushed_at
  ON public.features (project_id, last_pushed_at DESC NULLS LAST);
