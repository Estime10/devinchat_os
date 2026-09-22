-- parent_branch_name : branche dans laquelle celle-ci a été mergée (arbre)

ALTER TABLE public.features
  ADD COLUMN IF NOT EXISTS parent_branch_name text;

CREATE INDEX IF NOT EXISTS idx_features_project_parent_branch
  ON public.features (project_id, parent_branch_name);
