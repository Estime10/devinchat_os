-- PostgREST upsert échoue après le column-level SELECT revoke sur
-- credentials_* (RETURNING / merge-duplicates). Écriture via RPC DEFINER,
-- même modèle que get_own_github_credentials().

CREATE OR REPLACE FUNCTION public.upsert_own_github_connection(
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
  v_user_id uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated'
      USING ERRCODE = '42501';
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
    v_user_id,
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
  bigint, text, text, text, text[], timestamptz
) IS
  'Upsert connexion GitHub du user courant — credentials écrits server-side only';

REVOKE ALL ON FUNCTION public.upsert_own_github_connection(
  bigint, text, text, text, text[], timestamptz
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_own_github_connection(
  bigint, text, text, text, text[], timestamptz
) TO authenticated;
