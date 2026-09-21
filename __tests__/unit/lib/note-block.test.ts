import { describe, expect, it } from "vitest";
import {
  applyNoteBackspaceAtStart,
  applyNoteEnter,
  applyNoteLineShortcut,
  createNoteBlock,
  maybeConvertNoteShortcut,
  numberedListLabel,
} from "@/backend/features/04_features/domain/note-block";

describe("applyNoteLineShortcut", () => {
  it("convertit p en paragraph", () => {
    expect(applyNoteLineShortcut("p hello")).toEqual({
      type: "paragraph",
      text: "hello",
    });
  });

  it("convertit # en heading", () => {
    expect(applyNoteLineShortcut("# Title")).toEqual({
      type: "heading",
      text: "Title",
    });
  });

  it("convertit - et * en bullet", () => {
    expect(applyNoteLineShortcut("- hello")).toEqual({
      type: "bullet",
      text: "hello",
    });
    expect(applyNoteLineShortcut("* world")).toEqual({
      type: "bullet",
      text: "world",
    });
  });

  it("convertit 1. en numbered", () => {
    expect(applyNoteLineShortcut("1. item")).toEqual({
      type: "numbered",
      text: "item",
    });
  });

  it("ignore le texte sans raccourci", () => {
    expect(applyNoteLineShortcut("hello")).toBeNull();
    expect(applyNoteLineShortcut("-hello")).toBeNull();
  });
});

describe("setNoteBlockType", () => {
  it("applique un type depuis la toolbar", async () => {
    const { setNoteBlockType } =
      await import("@/backend/features/04_features/domain/note-block");
    const blocks = [createNoteBlock({ id: "a", text: "hello" })];
    const result = setNoteBlockType(blocks, 0, "heading");
    expect(result?.blocks[0]?.type).toBe("heading");
  });

  it("toggle vers paragraph si déjà actif", async () => {
    const { setNoteBlockType } =
      await import("@/backend/features/04_features/domain/note-block");
    const blocks = [
      createNoteBlock({ id: "a", type: "bullet", text: "hello" }),
    ];
    const result = setNoteBlockType(blocks, 0, "bullet");
    expect(result?.blocks[0]?.type).toBe("paragraph");
  });
});

describe("applyNoteEnter", () => {
  it("split un paragraphe", () => {
    const blocks = [createNoteBlock({ id: "a", text: "hello world" })];
    const result = applyNoteEnter(blocks, 0, 5);
    expect(result?.blocks.map((b) => b.text)).toEqual(["hello", " world"]);
    expect(result?.focusIndex).toBe(1);
  });

  it("liste vide → paragraphe", () => {
    const blocks = [createNoteBlock({ id: "a", type: "bullet", text: "" })];
    const result = applyNoteEnter(blocks, 0, 0);
    expect(result?.blocks[0]?.type).toBe("paragraph");
  });

  it("continue une liste", () => {
    const blocks = [createNoteBlock({ id: "a", type: "bullet", text: "one" })];
    const result = applyNoteEnter(blocks, 0, 3);
    expect(result?.blocks).toHaveLength(2);
    expect(result?.blocks[1]?.type).toBe("bullet");
    expect(result?.blocks[1]?.text).toBe("");
  });
});

describe("applyNoteBackspaceAtStart", () => {
  it("quitte une liste", () => {
    const blocks = [createNoteBlock({ id: "a", type: "bullet", text: "x" })];
    const result = applyNoteBackspaceAtStart(blocks, 0);
    expect(result?.blocks[0]?.type).toBe("paragraph");
  });

  it("fusionne avec le précédent", () => {
    const blocks = [
      createNoteBlock({ id: "a", text: "hello" }),
      createNoteBlock({ id: "b", text: "world" }),
    ];
    const result = applyNoteBackspaceAtStart(blocks, 1);
    expect(result?.blocks).toHaveLength(1);
    expect(result?.blocks[0]?.text).toBe("helloworld");
    expect(result?.focusOffset).toBe(5);
  });
});

describe("maybeConvertNoteShortcut", () => {
  it("ne strippe pas p en début de paragraphe", () => {
    const blocks = [createNoteBlock({ id: "a", text: "p hello" })];
    expect(maybeConvertNoteShortcut(blocks, 0, "p hello")).toBeNull();
  });

  it("convertit un paragraphe en bullet", () => {
    const blocks = [createNoteBlock({ id: "a", text: "- item" })];
    const result = maybeConvertNoteShortcut(blocks, 0, "- item");
    expect(result?.blocks[0]?.type).toBe("bullet");
    expect(result?.blocks[0]?.text).toBe("item");
  });

  it("repasse en text depuis une liste via p", () => {
    const blocks = [
      createNoteBlock({ id: "a", type: "bullet", text: "p note" }),
    ];
    const result = maybeConvertNoteShortcut(blocks, 0, "p note");
    expect(result?.blocks[0]?.type).toBe("paragraph");
    expect(result?.blocks[0]?.text).toBe("note");
  });
});

describe("numberedListLabel", () => {
  it("compte dans le run courant", () => {
    const blocks = [
      createNoteBlock({ id: "1", type: "numbered", text: "a" }),
      createNoteBlock({ id: "2", type: "numbered", text: "b" }),
      createNoteBlock({ id: "3", type: "paragraph", text: "x" }),
      createNoteBlock({ id: "4", type: "numbered", text: "c" }),
    ];
    expect(numberedListLabel(blocks, 0)).toBe(1);
    expect(numberedListLabel(blocks, 1)).toBe(2);
    expect(numberedListLabel(blocks, 3)).toBe(1);
  });
});

describe("hasNoteDocumentContent", () => {
  it("false si vide ou whitespace", async () => {
    const { hasNoteDocumentContent } =
      await import("@/backend/features/04_features/domain/note-block");
    expect(hasNoteDocumentContent([createNoteBlock({ text: "" })])).toBe(false);
    expect(hasNoteDocumentContent([createNoteBlock({ text: "  " })])).toBe(
      false,
    );
  });

  it("true dès qu’un bloc a du texte", async () => {
    const { hasNoteDocumentContent } =
      await import("@/backend/features/04_features/domain/note-block");
    expect(
      hasNoteDocumentContent([
        createNoteBlock({ text: "" }),
        createNoteBlock({ text: "note" }),
      ]),
    ).toBe(true);
  });
});
