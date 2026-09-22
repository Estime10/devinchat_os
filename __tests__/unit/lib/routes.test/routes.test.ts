import {
  isProtectedPath,
  parseAuthMode,
  PROTECTED_ROUTES,
  ROUTES,
} from "@/lib/routes";
import { describe, expect, it } from "vitest";

describe("ROUTES", () => {
  it("expose splash, auth, home, repository et api", () => {
    expect(ROUTES.splash).toBe("/");
    expect(ROUTES.auth).toBe("/auth");
    expect(ROUTES.authWithMode("login")).toBe("/auth?mode=login");
    expect(ROUTES.authWithMode("register")).toBe("/auth?mode=register");
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

describe("parseAuthMode", () => {
  it("accepte register, sinon login", () => {
    expect(parseAuthMode("register")).toBe("register");
    expect(parseAuthMode("login")).toBe("login");
    expect(parseAuthMode(null)).toBe("login");
    expect(parseAuthMode(undefined)).toBe("login");
    expect(parseAuthMode("other")).toBe("login");
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

  it("ne match pas splash, auth ni routes voisines", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/auth")).toBe(false);
    expect(isProtectedPath("/api/me")).toBe(false);
    expect(isProtectedPath("/homes")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
  });
});
