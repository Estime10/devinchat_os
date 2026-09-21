-- Ferme la lecture JWT des colonnes credentials (ciphertext / nonce).
-- En PostgreSQL, un GRANT SELECT table-level ignore un REVOKE colonne :
-- on retire le SELECT table, puis on re-grant les colonnes non sensibles.
-- Lecture server-only via RPC SECURITY DEFINER scoped à auth.uid().

REVOKE SELECT ON public.github_connections FROM authenticated;
REVOKE SELECT ON public.github_connections FROM anon;

GRANT SELECT (
  id,
  user_id,
  github_user_id,
  github_login,
  status,
  scopes,
  expires_at,
  created_at,
  updated_at
) ON public.github_connections TO authenticated;

-- INSERT / UPDATE / DELETE inchangés (OAuth upsert écrit encore ciphertext + nonce).

CREATE OR REPLACE FUNCTION public.get_own_github_credentials()
RETURNS TABLE (
  credentials_ciphertext text,
  credentials_nonce text,
  status public.github_connection_status
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    c.credentials_ciphertext,
    c.credentials_nonce,
    c.status
  FROM public.github_connections AS c
  WHERE c.user_id = auth.uid();
$$;

COMMENT ON FUNCTION public.get_own_github_credentials() IS
  'Retourne ciphertext GitHub du user courant uniquement — jamais via SELECT table';

REVOKE ALL ON FUNCTION public.get_own_github_credentials() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_own_github_credentials() TO authenticated;
