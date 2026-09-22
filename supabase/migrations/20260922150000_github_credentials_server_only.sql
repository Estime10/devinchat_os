-- P0.1 — Fermer vraiment l’écriture JWT sur github_connections
-- REVOKE colonne seul (écriture credentials_*) est insuffisant en PostgreSQL :
-- un UPDATE table-level peut encore toucher d’autres chemins. On retire
-- INSERT/UPDATE table, puis on re-grant UPDATE(status) seulement (expired).
--
-- P0.2 — Restreindre lecture/écriture credentials : EXECUTE réservé à service_role.
-- Les RPCs prennent p_user_id ; le serveur vérifie la session puis appelle en admin.

-- ---------------------------------------------------------------------------
-- P0.1 table privileges
-- ---------------------------------------------------------------------------

REVOKE INSERT ON public.github_connections FROM authenticated;
REVOKE INSERT ON public.github_connections FROM anon;
REVOKE UPDATE ON public.github_connections FROM authenticated;
REVOKE UPDATE ON public.github_connections FROM anon;

GRANT UPDATE (status) ON public.github_connections TO authenticated;

COMMENT ON TABLE public.github_connections IS
  'OAuth GitHub — JWT : SELECT non-secret + UPDATE(status) ; credentials via RPC service_role only';

-- ---------------------------------------------------------------------------
-- P0.2 get_own_github_credentials(p_user_id) — service_role only
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.get_own_github_credentials();

CREATE OR REPLACE FUNCTION public.get_own_github_credentials(p_user_id uuid)
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
  WHERE c.user_id = p_user_id
    AND p_user_id IS NOT NULL;
$$;

COMMENT ON FUNCTION public.get_own_github_credentials(uuid) IS
  'Ciphertext GitHub pour p_user_id — EXECUTE service_role only ; appelle après getUser()';

REVOKE ALL ON FUNCTION public.get_own_github_credentials(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_own_github_credentials(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_own_github_credentials(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_own_github_credentials(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- P0.2 upsert_own_github_connection(p_user_id, …) — service_role only
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.upsert_own_github_connection(
  bigint, text, text, text, text[], timestamptz
);

CREATE OR REPLACE FUNCTION public.upsert_own_github_connection(
  p_user_id uuid,
  p_github_user_id bigint,
  p_github_login text,
  p_credentials_ciphertext text,
  p_credentials_nonce text,
  p_scopes text[] DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user id required'
      USING ERRCODE = '22023';
  END IF;

  IF p_github_user_id IS NULL
     OR p_github_login IS NULL
     OR length(trim(p_github_login)) = 0
     OR p_credentials_ciphertext IS NULL
     OR length(trim(p_credentials_ciphertext)) = 0
     OR p_credentials_nonce IS NULL
     OR length(trim(p_credentials_nonce)) = 0 THEN
    RAISE EXCEPTION 'invalid github connection payload'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.github_connections (
    user_id,
    github_user_id,
    github_login,
    status,
    credentials_ciphertext,
    credentials_nonce,
    scopes,
    expires_at
  ) VALUES (
    p_user_id,
    p_github_user_id,
    trim(p_github_login),
    'active',
    p_credentials_ciphertext,
    p_credentials_nonce,
    p_scopes,
    p_expires_at
  )
  ON CONFLICT (user_id) DO UPDATE SET
    github_user_id = EXCLUDED.github_user_id,
    github_login = EXCLUDED.github_login,
    status = 'active',
    credentials_ciphertext = EXCLUDED.credentials_ciphertext,
    credentials_nonce = EXCLUDED.credentials_nonce,
    scopes = EXCLUDED.scopes,
    expires_at = EXCLUDED.expires_at
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION public.upsert_own_github_connection(
  uuid, bigint, text, text, text, text[], timestamptz
) IS
  'Upsert connexion GitHub pour p_user_id — EXECUTE service_role only ; appelle après getUser()';

REVOKE ALL ON FUNCTION public.upsert_own_github_connection(
  uuid, bigint, text, text, text, text[], timestamptz
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_own_github_connection(
  uuid, bigint, text, text, text, text[], timestamptz
) FROM anon;
REVOKE ALL ON FUNCTION public.upsert_own_github_connection(
  uuid, bigint, text, text, text, text[], timestamptz
) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_own_github_connection(
  uuid, bigint, text, text, text, text[], timestamptz
) TO service_role;
