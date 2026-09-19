import { API, API_ENDPOINTS } from "@/lib/api/endpoints";
import { describe, expect, it } from "vitest";

describe("API endpoints", () => {
  it("expose me + github connect/callback", () => {
    expect(API.me).toBe("/api/me");
    expect(API.github.connect).toBe("/api/github/connect");
    expect(API.github.callback).toBe("/api/github/callback");
  });

  it("liste plate tous les endpoints", () => {
    expect(API_ENDPOINTS).toEqual([
      "/api/me",
      "/api/github/connect",
      "/api/github/callback",
    ]);
  });
});
