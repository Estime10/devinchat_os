export type NoteBlockType = "paragraph" | "heading" | "bullet" | "numbered";

export type NoteBlock = {
  id: string;
  type: NoteBlockType;
  text: string;
};

export type NoteDocumentChange = {
  blocks: NoteBlock[];
  focusIndex: number;
  focusOffset: number;
};

export function createNoteBlock(input?: {
  id?: string;
  type?: NoteBlockType;
  text?: string;
}): NoteBlock {
  return {
    id: input?.id ?? crypto.randomUUID(),
    type: input?.type ?? "paragraph",
    text: input?.text ?? "",
  };
}

export function createEmptyNoteDocument(): NoteBlock[] {
  return [createNoteBlock()];
}

/**
 * True si au moins un bloc a du texte (après trim).
 */
export function hasNoteDocumentContent(blocks: readonly NoteBlock[]): boolean {
  return blocks.some((block) => block.text.trim().length > 0);
}

/**
 * True si le contenu éditeur diffère de la baseline (ignore les ids de blocs).
 */
export function isNoteDocumentDirty(
  current: readonly NoteBlock[],
  baseline: readonly NoteBlock[],
): boolean {
  if (current.length !== baseline.length) {
    return true;
  }
  return current.some((block, index) => {
    const other = baseline[index];
    if (!other) {
      return true;
    }
    return block.type !== other.type || block.text !== other.text;
  });
}

/**
 * Document vide (un seul paragraphe sans texte) — placeholder éditeur.
 */
export function isEmptyNoteDocument(blocks: readonly NoteBlock[]): boolean {
  return (
    blocks.length === 1 &&
    blocks[0]?.type === "paragraph" &&
    (blocks[0]?.text.length ?? 0) === 0
  );
}

/** Actions format (labels + raccourcis) — icônes côté UI. */
export const NOTE_FORMAT_ACTIONS = [
  { type: "paragraph", label: "Text", shortcut: "p" },
  { type: "heading", label: "Title", shortcut: "#" },
  { type: "bullet", label: "Bullet list", shortcut: "-" },
  { type: "numbered", label: "Numbered list", shortcut: "1." },
] as const satisfies ReadonlyArray<{
  type: NoteBlockType;
  label: string;
  shortcut: string;
}>;

/**
 * Raccourcis markdown en début de ligne (Espace après le motif).
 * `p ` → text · `# ` → heading · `- ` / `* ` → bullet · `1. ` → numbered.
 */
export function applyNoteLineShortcut(text: string): {
  type: NoteBlockType;
  text: string;
} | null {
  const plain = text.match(/^p\s([\s\S]*)$/i);
  if (plain) {
    return { type: "paragraph", text: plain[1] ?? "" };
  }

  const heading = text.match(/^#\s([\s\S]*)$/);
  if (heading) {
    return { type: "heading", text: heading[1] ?? "" };
  }

  const bullet = text.match(/^[-*]\s([\s\S]*)$/);
  if (bullet) {
    return { type: "bullet", text: bullet[1] ?? "" };
  }

  const numbered = text.match(/^\d+\.\s([\s\S]*)$/);
  if (numbered) {
    return { type: "numbered", text: numbered[1] ?? "" };
  }

  return null;
}

/**
 * Toggle / set le type du bloc actif (toolbar).
 * Même type → repasse en paragraph.
 */
export function setNoteBlockType(
  blocks: readonly NoteBlock[],
  index: number,
  type: NoteBlockType,
): NoteDocumentChange | null {
  const current = blocks[index];
  if (!current) {
    return null;
  }

  const nextType: NoteBlockType = current.type === type ? "paragraph" : type;

  if (current.type === nextType) {
    return null;
  }

  const next = blocks.map((block, i) =>
    i === index ? { ...block, type: nextType } : block,
  );

  return {
    blocks: next,
    focusIndex: index,
    focusOffset: current.text.length,
  };
}

/**
 * Index d’affichage pour un run de blocs numbered consécutifs.
 */
export function numberedListLabel(
  blocks: readonly NoteBlock[],
  index: number,
): number {
  let start = index;
  while (start > 0 && blocks[start - 1]?.type === "numbered") {
    start -= 1;
  }
  return index - start + 1;
}

function clampOffset(text: string, offset: number): number {
  return Math.max(0, Math.min(offset, text.length));
}

function continuesListType(type: NoteBlockType): NoteBlockType {
  if (type === "bullet" || type === "numbered") {
    return type;
  }
  return "paragraph";
}

/**
 * Enter : split du bloc · liste vide → paragraphe · heading → nouveau paragraphe.
 */
export function applyNoteEnter(
  blocks: readonly NoteBlock[],
  index: number,
  offset: number,
): NoteDocumentChange | null {
  const current = blocks[index];
  if (!current) {
    return null;
  }

  const caret = clampOffset(current.text, offset);

  if (
    (current.type === "bullet" || current.type === "numbered") &&
    current.text.length === 0
  ) {
    const next = blocks.map((block, i) =>
      i === index ? { ...block, type: "paragraph" as const } : block,
    );
    return { blocks: next, focusIndex: index, focusOffset: 0 };
  }

  const before = current.text.slice(0, caret);
  const after = current.text.slice(caret);
  const newBlock = createNoteBlock({
    type: continuesListType(current.type),
    text: after,
  });

  const next = [
    ...blocks.slice(0, index),
    { ...current, text: before },
    newBlock,
    ...blocks.slice(index + 1),
  ];

  return { blocks: next, focusIndex: index + 1, focusOffset: 0 };
}

/**
 * Backspace en début de bloc : fusionne avec le précédent, ou quitte liste/titre.
 */
export function applyNoteBackspaceAtStart(
  blocks: readonly NoteBlock[],
  index: number,
): NoteDocumentChange | null {
  const current = blocks[index];
  if (!current) {
    return null;
  }

  if (
    current.type === "bullet" ||
    current.type === "numbered" ||
    current.type === "heading"
  ) {
    const next = blocks.map((block, i) =>
      i === index ? { ...block, type: "paragraph" as const } : block,
    );
    return { blocks: next, focusIndex: index, focusOffset: 0 };
  }

  if (index === 0) {
    return null;
  }

  const previous = blocks[index - 1];
  if (!previous) {
    return null;
  }

  const mergedText = previous.text + current.text;
  const focusOffset = previous.text.length;
  const next = [
    ...blocks.slice(0, index - 1),
    { ...previous, text: mergedText },
    ...blocks.slice(index + 1),
  ];

  return { blocks: next, focusIndex: index - 1, focusOffset };
}

export function updateNoteBlockText(
  blocks: readonly NoteBlock[],
  index: number,
  text: string,
): NoteBlock[] {
  return blocks.map((block, i) => (i === index ? { ...block, text } : block));
}

/**
 * Coller du texte brut — une ligne = insert · multi-lignes = nouveaux blocs.
 * Focus sur la dernière ligne collée.
 */
export function applyNotePaste(
  blocks: readonly NoteBlock[],
  index: number,
  offset: number,
  pasted: string,
): NoteDocumentChange | null {
  const current = blocks[index];
  if (!current) {
    return null;
  }

  const caret = clampOffset(current.text, offset);
  const before = current.text.slice(0, caret);
  const after = current.text.slice(caret);
  const lines = pasted.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  if (lines.length === 1) {
    const inserted = lines[0] ?? "";
    const text = before + inserted + after;
    return {
      blocks: updateNoteBlockText(blocks, index, text),
      focusIndex: index,
      focusOffset: before.length + inserted.length,
    };
  }

  const firstText = before + (lines[0] ?? "");
  const lastPasted = lines[lines.length - 1] ?? "";
  const middleLines = lines.slice(1, -1);
  const continuedType = continuesListType(current.type);

  const insertedBlocks: NoteBlock[] = [
    { ...current, text: firstText },
    ...middleLines.map((text) =>
      createNoteBlock({ type: continuedType, text }),
    ),
    createNoteBlock({
      type: continuedType,
      text: lastPasted + after,
    }),
  ];

  const next = [
    ...blocks.slice(0, index),
    ...insertedBlocks,
    ...blocks.slice(index + 1),
  ];
  const focusIndex = index + insertedBlocks.length - 1;

  return {
    blocks: next,
    focusIndex,
    focusOffset: lastPasted.length,
  };
}

/**
 * Insère une ref image (ex. image1) comme bloc dédié au caret.
 * Focus sur le bloc suivant pour continuer à écrire.
 */
export function applyNoteInsertAttachmentRef(
  blocks: readonly NoteBlock[],
  index: number,
  offset: number,
  label: string,
): NoteDocumentChange | null {
  const current = blocks[index];
  if (!current) {
    return null;
  }

  const caret = clampOffset(current.text, offset);
  const before = current.text.slice(0, caret);
  const after = current.text.slice(caret);
  const refBlock = createNoteBlock({ type: "paragraph", text: label });
  const afterType =
    current.type === "heading" ? "paragraph" : continuesListType(current.type);
  const afterBlock = createNoteBlock({ type: afterType, text: after });

  if (before.length === 0) {
    return {
      blocks: [
        ...blocks.slice(0, index),
        refBlock,
        afterBlock,
        ...blocks.slice(index + 1),
      ],
      focusIndex: index + 1,
      focusOffset: 0,
    };
  }

  return {
    blocks: [
      ...blocks.slice(0, index),
      { ...current, text: before },
      refBlock,
      afterBlock,
      ...blocks.slice(index + 1),
    ],
    focusIndex: index + 2,
    focusOffset: 0,
  };
}

/**
 * Applique un raccourci markdown si le texte du bloc le déclenche.
 * Changement de format depuis n’importe quel type.
 * `p ` → text uniquement hors paragraphe (ne strippe pas un vrai "p …").
 */
export function maybeConvertNoteShortcut(
  blocks: readonly NoteBlock[],
  index: number,
  text: string,
): NoteDocumentChange | null {
  const current = blocks[index];
  if (!current) {
    return null;
  }

  const shortcut = applyNoteLineShortcut(text);
  if (!shortcut) {
    return null;
  }

  if (shortcut.type === "paragraph" && current.type === "paragraph") {
    return null;
  }

  if (shortcut.type === current.type && shortcut.text === text) {
    return null;
  }

  const next = blocks.map((block, i) =>
    i === index
      ? { ...block, type: shortcut.type, text: shortcut.text }
      : block,
  );

  return {
    blocks: next,
    focusIndex: index,
    focusOffset: shortcut.text.length,
  };
}
