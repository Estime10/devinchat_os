-- github_connections : OAuth GitHub lié à auth.users (doc/03_DATABASE_DESIGN §5.3)
-- Tokens stockés chiffrés (credentials_ciphertext + nonce) — jamais en clair.

DO $$
BEGIN
  CREATE TYPE public.github_connection_status AS ENUM (
    'active',
    'expired',
    'revoked',
    'error'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS public.github_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  github_user_id bigint NOT NULL,
  github_login text NOT NULL,
  status public.github_connection_status NOT NULL DEFAULT 'active',
  credentials_ciphertext text NOT NULL,
  credentials_nonce text,
  scopes text[],
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT github_connections_user_id_key UNIQUE (user_id),
  CONSTRAINT github_connections_github_user_id_key UNIQUE (github_user_id)
);

COMMENT ON TABLE public.github_connections IS
  'Connexion OAuth GitHub 1:1 user — credentials chiffrés server-side only';

CREATE TRIGGER github_connections_set_updated_at
BEFORE UPDATE ON public.github_connections
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.github_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "github_connections_select_own"
ON public.github_connections
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "github_connections_insert_own"
ON public.github_connections
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "github_connections_update_own"
ON public.github_connections
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "github_connections_delete_own"
ON public.github_connections
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
