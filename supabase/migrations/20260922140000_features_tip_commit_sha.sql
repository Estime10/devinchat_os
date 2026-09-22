-- Tip commit SHA (branche) — label UI « commit abc1234 » à la place de committed

ALTER TABLE public.features
  ADD COLUMN IF NOT EXISTS tip_commit_sha text;

COMMENT ON COLUMN public.features.tip_commit_sha IS
  'SHA du tip commit GitHub (branche) — affichage court côté UI';
