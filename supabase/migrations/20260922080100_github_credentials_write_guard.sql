-- Credentials : écriture ciphertext/nonce uniquement via RPC DEFINER.
-- SELECT déjà fermé (github_credentials_column_guard).

REVOKE INSERT (credentials_ciphertext, credentials_nonce)
  ON public.github_connections
  FROM authenticated;

REVOKE UPDATE (credentials_ciphertext, credentials_nonce)
  ON public.github_connections
  FROM authenticated;

REVOKE INSERT (credentials_ciphertext, credentials_nonce)
  ON public.github_connections
  FROM anon;

REVOKE UPDATE (credentials_ciphertext, credentials_nonce)
  ON public.github_connections
  FROM anon;
