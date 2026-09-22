import { canReconnectGithub } from "@/backend/features/02_github/domain/can-reconnect-github/can-reconnect-github";
import { isGithubConnectionActive } from "@/backend/features/02_github/domain/is-github-connection-active/is-github-connection-active";
import { resolveGithubOAuthError } from "@/backend/features/02_github/messages/resolve-github-oauth-error";
import type { OwnGithubConnection } from "@/backend/features/02_github/services/get-own-github-connection/get-own-github-connection";
import { describe, expect, it } from "vitest";

function connection(
  status: OwnGithubConnection["status"],
): OwnGithubConnection {
  return {
    id: "1",
    githubLogin: "devin",
    status,
    scopes: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

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

describe("isGithubConnectionActive", () => {
  it("true seulement si status active", () => {
    expect(isGithubConnectionActive(connection("active"))).toBe(true);
    expect(isGithubConnectionActive(connection("expired"))).toBe(false);
    expect(isGithubConnectionActive(null)).toBe(false);
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
