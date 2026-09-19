import { encryptAesGcm } from "@/lib/crypto/aes-gcm";
import { getGithubOAuthEnv } from "@/lib/github/env";
import type { GithubTokenResponse } from "@/lib/github/oauth";
import { createClient } from "@/lib/supabase/server";

export type UpsertGithubConnectionInput = {
  userId: string;
  githubUserId: number;
  githubLogin: string;
  token: GithubTokenResponse;
};

/**
 * Upsert connexion GitHub — credentials chiffrés avant écriture.
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

  const { error } = await supabase.from("github_connections").upsert(
    {
      user_id: input.userId,
      github_user_id: input.githubUserId,
      github_login: input.githubLogin,
      status: "active",
      credentials_ciphertext: encrypted.ciphertext,
      credentials_nonce: encrypted.nonce,
      scopes,
      expires_at: null,
    },
    { onConflict: "user_id" },
  );

  if (!error) {
    return { ok: true };
  }

  if (error.code === "23505") {
    return { ok: false, reason: "conflict" };
  }

  return { ok: false, reason: "persist" };
}
