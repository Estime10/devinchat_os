import { isWebpBytes } from "@/lib/notes/is-webp-bytes/is-webp-bytes";
import { describe, expect, it } from "vitest";

describe("isWebpBytes", () => {
  it("accepte un en-tête RIFF/WEBP minimal", () => {
    const bytes = new Uint8Array(12);
    bytes.set([0x52, 0x49, 0x46, 0x46], 0);
    bytes.set([0x57, 0x45, 0x42, 0x50], 8);
    expect(isWebpBytes(bytes)).toBe(true);
  });

  it("rejette trop court ou mauvais magic", () => {
    expect(isWebpBytes(new Uint8Array(8))).toBe(false);
    const jpeg = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    expect(isWebpBytes(jpeg)).toBe(false);
  });
});
