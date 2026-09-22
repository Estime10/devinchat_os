import { decryptAesGcm, encryptAesGcm } from "@/lib/crypto/aes-gcm";
import { buildGithubAuthorizeUrl } from "@/lib/github/oauth/oauth";
import { describe, expect, it } from "vitest";

describe("encryptAesGcm / decryptAesGcm", () => {
  const key = Buffer.alloc(32, 7).toString("base64");

  it("round-trip plaintext", () => {
    const encrypted = encryptAesGcm('{"access_token":"ghp_test"}', key);
    expect(encrypted.ciphertext).toBeTruthy();
    expect(encrypted.nonce).toBeTruthy();
    expect(decryptAesGcm(encrypted, key)).toBe('{"access_token":"ghp_test"}');
  });

  it("rejects wrong key length", () => {
    expect(() =>
      encryptAesGcm("x", Buffer.alloc(16).toString("base64")),
    ).toThrow(/32 bytes/);
  });
});

describe("buildGithubAuthorizeUrl", () => {
  it("includes client_id, redirect, state and scopes", () => {
    const url = new URL(
      buildGithubAuthorizeUrl({
        clientId: "abc123",
        redirectUri: "http://localhost:3000/api/github/callback",
        state: "state-token",
      }),
    );

    expect(url.origin + url.pathname).toBe(
      "https://github.com/login/oauth/authorize",
    );
    expect(url.searchParams.get("client_id")).toBe("abc123");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/api/github/callback",
    );
    expect(url.searchParams.get("state")).toBe("state-token");
    expect(url.searchParams.get("scope")).toContain("read:user");
    expect(url.searchParams.get("scope")).toContain("repo");
  });
});
