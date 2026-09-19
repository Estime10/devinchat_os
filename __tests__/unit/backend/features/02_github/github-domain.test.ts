import { canReconnectGithub } from "@/backend/features/02_github/domain/can-reconnect-github";
import { resolveGithubOAuthError } from "@/backend/features/02_github/messages/resolve-github-oauth-error";
import { describe, expect, it } from "vitest";

describe("canReconnectGithub", () => {
  it("refuse reconnect si active", () => {
    expect(canReconnectGithub("active")).toBe(false);
  });

  it("autorise reconnect si expired / revoked / error", () => {
    expect(canReconnectGithub("expired")).toBe(true);
    expect(canReconnectGithub("revoked")).toBe(true);
    expect(canReconnectGithub("error")).toBe(true);
  });

  it("autorise reconnect si force même en active", () => {
    expect(canReconnectGithub("active", { force: true })).toBe(true);
  });
});

describe("resolveGithubOAuthError", () => {
  it("retourne null sans code", () => {
    expect(resolveGithubOAuthError()).toBeNull();
  });

  it("mappe les codes connus", () => {
    expect(resolveGithubOAuthError("denied")).toMatch(/denied/i);
  });

  it("fallback sur code inconnu", () => {
    expect(resolveGithubOAuthError("weird")).toMatch(/failed/i);
  });
});
