import { decryptAesGcm } from "@/lib/crypto/aes-gcm";
import { getGithubOAuthEnv } from "@/lib/github/env/env";
import { createAdminClient } from "@/lib/supabase/admin/admin";
import { getSupabaseAdminEnv } from "@/lib/supabase/env/env";
import { createClient } from "@/lib/supabase/server/server";
import { cache } from "react";
import { z } from "zod";

const credentialsSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string().optional(),
  scope: z.string().optional(),
});

const rpcRowSchema = z.object({
  credentials_ciphertext: z.string().min(1),
  credentials_nonce: z.string().min(1),
  status: z.enum(["active", "expired", "revoked", "error"]),
});

/**
 * Access token GitHub du user — server-only, jamais exposé au client.
 * Session via JWT user ; lecture ciphertext via RPC service_role (p_user_id).
 * `cache()` déduplique au sein d’une même requête RSC.
 */
export const getOwnGithubAccessToken = cache(
  async (): Promise<string | null> => {
    if (!getSupabaseAdminEnv()) {
      return null;
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const admin = createAdminClient();
    const { data, error } = await admin.rpc("get_own_github_credentials", {
      p_user_id: user.id,
    });

    if (error || !data) {
      return null;
    }

    const rows = z.array(rpcRowSchema).safeParse(data);
    if (!rows.success || rows.data.length === 0) {
      return null;
    }

    const row = rows.data[0];
    if (row.status !== "active") {
      return null;
    }

    try {
      const { encryptionKey } = getGithubOAuthEnv();
      const plaintext = decryptAesGcm(
        {
          ciphertext: row.credentials_ciphertext,
          nonce: row.credentials_nonce,
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
