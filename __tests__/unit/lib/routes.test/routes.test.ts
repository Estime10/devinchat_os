import { isProtectedPath, PROTECTED_ROUTES, ROUTES } from "@/lib/routes";
import { describe, expect, it } from "vitest";

describe("ROUTES", () => {
  it("expose les chemins auth, home, repository et api", () => {
    expect(ROUTES.auth).toBe("/");
    expect(ROUTES.home).toBe("/home");
    expect(ROUTES.repositoryRoot).toBe("/repository");
    expect(ROUTES.repository("acme", "app")).toBe("/repository/acme/app");
    expect(ROUTES.api.me).toBe("/api/me");
    expect(ROUTES.api.github.connect).toBe("/api/github/connect");
    expect(ROUTES.api.github.callback).toBe("/api/github/callback");
  });

  it("marque home et repository comme routes protégées", () => {
    expect(PROTECTED_ROUTES).toContain(ROUTES.home);
    expect(PROTECTED_ROUTES).toContain(ROUTES.repositoryRoot);
  });
});

describe("isProtectedPath", () => {
  it("match /home exact", () => {
    expect(isProtectedPath("/home")).toBe(true);
  });

  it("match les sous-chemins de /home", () => {
    expect(isProtectedPath("/home/settings")).toBe(true);
  });

  it("match /repository et ses slugs", () => {
    expect(isProtectedPath("/repository")).toBe(true);
    expect(isProtectedPath("/repository/acme/app")).toBe(true);
  });

  it("ne match pas la page auth ni des routes voisines", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/api/me")).toBe(false);
    expect(isProtectedPath("/homes")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
  });
});
