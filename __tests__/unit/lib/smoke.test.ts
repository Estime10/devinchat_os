/**
 * Smoke test — vérifie que Vitest tourne.
 * Convention : __tests__/unit|integration (séparés du code app/features/components).
 */
import { describe, expect, it } from "vitest";

describe("vitest setup", () => {
  it("exécute un test unitaire", () => {
    expect(1 + 1).toBe(2);
  });
});
