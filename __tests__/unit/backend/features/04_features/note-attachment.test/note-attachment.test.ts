import {
  isNoteAttachmentRefText,
  nextNoteAttachmentLabel,
  removeNoteAttachmentRefFromBlocks,
} from "@/backend/features/04_features/domain/note-attachment/note-attachment";
import { createNoteBlock } from "@/backend/features/04_features/domain/note-block/note-block";
import { describe, expect, it } from "vitest";

describe("nextNoteAttachmentLabel", () => {
  it("incrémente au-delà du max existant", () => {
    expect(
      nextNoteAttachmentLabel([{ label: "image1" }, { label: "image3" }]),
    ).toBe("image4");
  });
});

describe("isNoteAttachmentRefText", () => {
  it("accepte imageN seul", () => {
    expect(isNoteAttachmentRefText("image1")).toBe(true);
    expect(isNoteAttachmentRefText("  IMAGE2  ")).toBe(true);
  });

  it("refuse le texte composé", () => {
    expect(isNoteAttachmentRefText("see image1")).toBe(false);
    expect(isNoteAttachmentRefText("image1!")).toBe(false);
  });
});

describe("removeNoteAttachmentRefFromBlocks", () => {
  it("retire les blocs ref exacts du label", () => {
    const blocks = [
      createNoteBlock({ id: "a", text: "hello" }),
      createNoteBlock({ id: "b", text: "image1" }),
      createNoteBlock({ id: "c", text: "world" }),
      createNoteBlock({ id: "d", text: "image1" }),
    ];
    expect(
      removeNoteAttachmentRefFromBlocks(blocks, "image1").map((b) => b.text),
    ).toEqual(["hello", "world"]);
  });

  it("ne touche pas au texte qui mentionne la ref", () => {
    const blocks = [
      createNoteBlock({ id: "a", text: "see image1 later" }),
      createNoteBlock({ id: "b", text: "image2" }),
    ];
    expect(
      removeNoteAttachmentRefFromBlocks(blocks, "image1").map((b) => b.text),
    ).toEqual(["see image1 later", "image2"]);
  });
});
