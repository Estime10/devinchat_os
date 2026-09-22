import { encryptAesGcm } from "@/lib/crypto/aes-gcm";
import { getGithubOAuthEnv } from "@/lib/github/env/env";
import type { GithubTokenResponse } from "@/lib/github/oauth/oauth";
import { createClient } from "@/lib/supabase/server/server";

export type UpsertGithubConnectionInput = {
  userId: string;
  githubUserId: number;
  githubLogin: string;
  token: GithubTokenResponse;
};

/**
 * Upsert connexion GitHub — credentials chiffrés avant écriture.
 * Écriture via RPC (colonnes ciphertext interdites au SELECT/RETURNING JWT).
 */
export async function upsertGithubConnection(
  input: UpsertGithubConnectionInput,
): Promise<{ ok: true } | { ok: false; reason: "conflict" | "persist" }> {
  const { encryptionKey } = getGithubOAuthEnv();
  const credentialsJson = JSON.stringify({
    access_token: input.token.access_token,
    token_type: input.token.token_type,
    scope: input.token.scope,
  });
  const encrypted = encryptAesGcm(credentialsJson, encryptionKey);
  const scopes = input.token.scope
    .split(/[\s,]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== input.userId) {
    return { ok: false, reason: "persist" };
  }

  const { error } = await supabase.rpc("upsert_own_github_connection", {
    p_github_user_id: input.githubUserId,
    p_github_login: input.githubLogin,
    p_credentials_ciphertext: encrypted.ciphertext,
    p_credentials_nonce: encrypted.nonce,
    p_scopes: scopes,
    p_expires_at: null,
  });

  if (!error) {
    return { ok: true };
  }

  if (error.code === "23505") {
    return { ok: false, reason: "conflict" };
  }

  return { ok: false, reason: "persist" };
}
