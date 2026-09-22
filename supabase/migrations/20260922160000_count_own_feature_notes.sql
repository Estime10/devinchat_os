-- Agrégat notes par feature — badges UI sans SELECT de toutes les rows
-- (plafond PostgREST ~1000). RLS INVOKER = ownership project inchangé.

CREATE OR REPLACE FUNCTION public.count_own_feature_notes(p_feature_ids uuid[])
RETURNS TABLE (
  feature_id uuid,
  note_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    fn.feature_id,
    count(*)::bigint AS note_count
  FROM public.feature_notes AS fn
  WHERE fn.feature_id = ANY (p_feature_ids)
  GROUP BY fn.feature_id;
$$;

COMMENT ON FUNCTION public.count_own_feature_notes(uuid[]) IS
  'Compte les notes par feature_id (RLS INVOKER) — badges repository';

REVOKE ALL ON FUNCTION public.count_own_feature_notes(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_own_feature_notes(uuid[]) TO authenticated;
