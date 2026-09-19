import { isProtectedPath, PROTECTED_ROUTES, ROUTES } from "@/lib/routes";
import { describe, expect, it } from "vitest";

describe("ROUTES", () => {
  it("expose les chemins auth, home et api.me", () => {
    expect(ROUTES.auth).toBe("/");
    expect(ROUTES.home).toBe("/home");
    expect(ROUTES.api.me).toBe("/api/me");
  });

  it("marque home comme route protégée", () => {
    expect(PROTECTED_ROUTES).toContain(ROUTES.home);
  });
});

describe("isProtectedPath", () => {
  it("match /home exact", () => {
    expect(isProtectedPath("/home")).toBe(true);
  });

  it("match les sous-chemins de /home", () => {
    expect(isProtectedPath("/home/settings")).toBe(true);
  });

  it("ne match pas la page auth ni des routes voisines", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/api/me")).toBe(false);
    expect(isProtectedPath("/homes")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
  });
});
