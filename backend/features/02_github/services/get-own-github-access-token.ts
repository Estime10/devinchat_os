import { decryptAesGcm } from "@/lib/crypto/aes-gcm";
import { getGithubOAuthEnv } from "@/lib/github/env";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import { z } from "zod";

const credentialsSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string().optional(),
  scope: z.string().optional(),
});

/**
 * Access token GitHub du user — server-only, jamais exposé au client.
 * `cache()` déduplique au sein d’une même requête RSC.
 */
export const getOwnGithubAccessToken = cache(
  async (): Promise<string | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from("github_connections")
      .select("credentials_ciphertext, credentials_nonce, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data || data.status !== "active") {
      return null;
    }

    if (!data.credentials_ciphertext || !data.credentials_nonce) {
      return null;
    }

    try {
      const { encryptionKey } = getGithubOAuthEnv();
      const plaintext = decryptAesGcm(
        {
          ciphertext: data.credentials_ciphertext,
          nonce: data.credentials_nonce,
        },
        encryptionKey,
      );
      const parsed = credentialsSchema.safeParse(JSON.parse(plaintext));
      if (!parsed.success) {
        return null;
      }
      return parsed.data.access_token;
    } catch {
      return null;
    }
  },
);
