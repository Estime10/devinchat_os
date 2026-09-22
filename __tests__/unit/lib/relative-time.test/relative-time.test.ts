import { formatRelativeTime } from "@/lib/format/relative-time/relative-time";
import { describe, expect, it } from "vitest";

describe("formatRelativeTime", () => {
  const now = new Date("2026-09-19T12:00:00.000Z");

  it("formate minutes / jours / mois", () => {
    expect(formatRelativeTime("2026-09-19T11:30:00.000Z", now)).toBe("30m ago");
    expect(formatRelativeTime("2026-09-17T12:00:00.000Z", now)).toBe("2d ago");
    expect(formatRelativeTime("2026-06-19T12:00:00.000Z", now)).toBe("3mo ago");
  });

  it("retourne — si date invalide", () => {
    expect(formatRelativeTime("not-a-date", now)).toBe("—");
  });
});
