import { saveOwnFeatureNote } from "@/backend/features/04_features/services/save-own-feature-note/save-own-feature-note";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, uploadMock, removeFilesMock, gcMock, signMock } =
  vi.hoisted(() => ({
    createClientMock: vi.fn(),
    uploadMock: vi.fn(),
    removeFilesMock: vi.fn(async () => undefined),
    gcMock: vi.fn(async () => undefined),
    signMock: vi.fn(async (attachments: unknown) => attachments),
  }));

vi.mock("@/lib/supabase/server/server", () => ({
  createClient: createClientMock,
}));

vi.mock(
  "@/backend/features/04_features/services/upload-own-feature-note-attachment/upload-own-feature-note-attachment",
  () => ({
    toStoredAttachment: (attachment: {
      id: string;
      path: string;
      url: string;
      name: string;
      mimeType: string;
      size: number;
      label: string;
    }) => ({ ...attachment, url: "" }),
    signOwnFeatureNoteAttachmentUrls: signMock,
    removeOwnFeatureNoteAttachmentFiles: removeFilesMock,
    garbageCollectOwnFeatureNoteAttachmentFolder: gcMock,
    uploadOwnFeatureNoteAttachment: uploadMock,
  }),
);

const FEATURE_ID = "11111111-1111-1111-1111-111111111111";
const NOTE_ID = "22222222-2222-2222-2222-222222222222";
const USER_ID = "33333333-3333-3333-3333-333333333333";
const T0 = "2026-09-22T10:00:00.000Z";
const T1 = "2026-09-22T10:00:01.000Z";
const T2 = "2026-09-22T10:00:02.000Z";
const T_OTHER = "2026-09-22T09:59:00.000Z";

const blocks = [{ id: "b1", type: "paragraph" as const, text: "hello note" }];

type UpdateCall = {
  payload: Record<string, unknown>;
  filters: Record<string, string>;
};

type MockDb = {
  currentUpdatedAt: string;
  /** Contenu : match `from` → succès et stamp `to`. */
  contentUpdate: { from: string; to: string } | null;
  /** Attachments : match `from` → succès ; "fail" → data null. */
  attachmentsUpdate: { from: string; to: string } | "fail" | null;
  /** Rollback : match `from` → stamp `to`. */
  rollback: { from: string; to: string } | null;
  /** Après 1er UPDATE contenu réussi, force le stamp lu (concurrence). */
  afterContentCurrent?: string;
  updateCalls: UpdateCall[];
};

function noteRow(updatedAt: string) {
  return {
    id: NOTE_ID,
    feature_id: FEATURE_ID,
    title: "hello note",
    updated_at: updatedAt,
  };
}

function createSupabaseMock(db: MockDb) {
  const from = vi.fn(() => {
    let op: "select" | "update" | "insert" | "delete" = "select";
    let payload: Record<string, unknown> = {};
    const filters: Record<string, string> = {};
    let selectCols = "";

    const builder = {
      select(cols?: string) {
        if (typeof cols === "string") {
          selectCols = cols;
        }
        return builder;
      },
      update(next: Record<string, unknown>) {
        op = "update";
        payload = next;
        return builder;
      },
      insert() {
        op = "insert";
        return builder;
      },
      delete() {
        op = "delete";
        return builder;
      },
      eq(column: string, value: string) {
        filters[column] = value;
        return builder;
      },
      async maybeSingle() {
        if (op === "select") {
          if (selectCols === "updated_at") {
            return {
              data: { updated_at: db.currentUpdatedAt },
              error: null,
            };
          }
          return {
            data: {
              title: "hello note",
              body: blocks,
              attachments: [],
              updated_at: db.currentUpdatedAt,
            },
            error: null,
          };
        }

        if (op === "delete") {
          return { data: null, error: null };
        }

        if (op !== "update") {
          return { data: null, error: null };
        }

        db.updateCalls.push({
          payload: { ...payload },
          filters: { ...filters },
        });

        const stamp = filters.updated_at;
        const keys = Object.keys(payload);
        const isAttachmentsOnly =
          keys.length === 1 && keys[0] === "attachments";

        // Rollback = update après le content, stamp = post-content (T1), pas attachments-only.
        const isRollbackUpdate =
          db.rollback !== null &&
          stamp === db.rollback.from &&
          db.updateCalls.length >= 2 &&
          !isAttachmentsOnly &&
          stamp !== db.contentUpdate?.from;

        if (isAttachmentsOnly) {
          if (db.attachmentsUpdate === "fail") {
            return { data: null, error: null };
          }
          if (db.attachmentsUpdate && stamp === db.attachmentsUpdate.from) {
            db.currentUpdatedAt = db.attachmentsUpdate.to;
            return {
              data: noteRow(db.attachmentsUpdate.to),
              error: null,
            };
          }
          return { data: null, error: null };
        }

        if (isRollbackUpdate && db.rollback && stamp === db.rollback.from) {
          db.currentUpdatedAt = db.rollback.to;
          return { data: { updated_at: db.rollback.to }, error: null };
        }

        if (db.contentUpdate && stamp === db.contentUpdate.from) {
          db.currentUpdatedAt = db.afterContentCurrent ?? db.contentUpdate.to;
          return {
            data: noteRow(db.contentUpdate.to),
            error: null,
          };
        }

        return { data: null, error: null };
      },
    };

    return builder;
  });

  return {
    auth: {
      getUser: async () => ({ data: { user: { id: USER_ID } } }),
    },
    from,
  };
}

function pendingFile() {
  return {
    id: "att-1",
    file: new File([new Uint8Array([1, 2, 3])], "a.webp", {
      type: "image/webp",
    }),
    label: "image1",
  };
}

function uploadedAttachment() {
  return {
    id: "att-1",
    path: `${USER_ID}/${FEATURE_ID}/${NOTE_ID}/att-1.webp`,
    url: "",
    name: "a.webp",
    mimeType: "image/webp",
    size: 3,
    label: "image1",
  };
}

describe("saveOwnFeatureNote — optimistic updated_at", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signMock.mockImplementation(async (attachments: unknown) => attachments);
    removeFilesMock.mockResolvedValue(undefined);
    gcMock.mockResolvedValue(undefined);
  });

  it("refuse un update sans expectedUpdatedAt", async () => {
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        currentUpdatedAt: T0,
        contentUpdate: null,
        attachmentsUpdate: null,
        rollback: null,
        updateCalls: [],
      }),
    );

    await expect(
      saveOwnFeatureNote({
        featureId: FEATURE_ID,
        noteId: NOTE_ID,
        expectedUpdatedAt: null,
        blocks,
        retainedAttachments: [],
        newFiles: [],
      }),
    ).resolves.toEqual({ kind: "error" });
  });

  it("renvoie conflict + currentUpdatedAt si expectedUpdatedAt est périmé", async () => {
    const db: MockDb = {
      currentUpdatedAt: T_OTHER,
      contentUpdate: null,
      attachmentsUpdate: null,
      rollback: null,
      updateCalls: [],
    };
    createClientMock.mockResolvedValue(createSupabaseMock(db));

    const result = await saveOwnFeatureNote({
      featureId: FEATURE_ID,
      noteId: NOTE_ID,
      expectedUpdatedAt: T0,
      blocks,
      retainedAttachments: [],
      newFiles: [],
    });

    expect(result).toEqual({
      kind: "conflict",
      currentUpdatedAt: T_OTHER,
    });
    expect(db.updateCalls[0]?.filters.updated_at).toBe(T0);
  });

  it("succès : note.updatedAt = stamp post-update (T1)", async () => {
    const db: MockDb = {
      currentUpdatedAt: T0,
      contentUpdate: { from: T0, to: T1 },
      attachmentsUpdate: null,
      rollback: null,
      updateCalls: [],
    };
    createClientMock.mockResolvedValue(createSupabaseMock(db));

    const result = await saveOwnFeatureNote({
      featureId: FEATURE_ID,
      noteId: NOTE_ID,
      expectedUpdatedAt: T0,
      blocks,
      retainedAttachments: [],
      newFiles: [],
    });

    expect(result).toEqual({
      kind: "ok",
      note: expect.objectContaining({
        id: NOTE_ID,
        updatedAt: T1,
      }),
    });
    expect(db.updateCalls[0]?.filters.updated_at).toBe(T0);
  });

  it("échec upload après touch → error.currentUpdatedAt = stamp post-rollback", async () => {
    const db: MockDb = {
      currentUpdatedAt: T0,
      contentUpdate: { from: T0, to: T1 },
      attachmentsUpdate: null,
      rollback: { from: T1, to: T2 },
      updateCalls: [],
    };
    createClientMock.mockResolvedValue(createSupabaseMock(db));
    uploadMock.mockResolvedValue(null);

    const result = await saveOwnFeatureNote({
      featureId: FEATURE_ID,
      noteId: NOTE_ID,
      expectedUpdatedAt: T0,
      blocks,
      retainedAttachments: [],
      newFiles: [pendingFile()],
    });

    expect(result).toEqual({
      kind: "error",
      currentUpdatedAt: T2,
    });
    expect(db.updateCalls.map((call) => call.filters.updated_at)).toEqual([
      T0,
      T1,
    ]);
  });

  it("2ᵉ UPDATE attachments filtre sur T1 (pas T0) et renvoie T2", async () => {
    const db: MockDb = {
      currentUpdatedAt: T0,
      contentUpdate: { from: T0, to: T1 },
      attachmentsUpdate: { from: T1, to: T2 },
      rollback: null,
      updateCalls: [],
    };
    createClientMock.mockResolvedValue(createSupabaseMock(db));
    uploadMock.mockResolvedValue(uploadedAttachment());

    const result = await saveOwnFeatureNote({
      featureId: FEATURE_ID,
      noteId: NOTE_ID,
      expectedUpdatedAt: T0,
      blocks,
      retainedAttachments: [],
      newFiles: [pendingFile()],
    });

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.note.updatedAt).toBe(T2);
    }
    expect(db.updateCalls.map((call) => call.filters.updated_at)).toEqual([
      T0,
      T1,
    ]);
    expect(db.updateCalls[1]?.payload).toHaveProperty("attachments");
  });

  it("2ᵉ UPDATE concurrent → conflict.currentUpdatedAt ≠ T0", async () => {
    const db: MockDb = {
      currentUpdatedAt: T0,
      contentUpdate: { from: T0, to: T1 },
      attachmentsUpdate: "fail",
      rollback: null,
      afterContentCurrent: T_OTHER,
      updateCalls: [],
    };
    createClientMock.mockResolvedValue(createSupabaseMock(db));
    uploadMock.mockResolvedValue(uploadedAttachment());

    const result = await saveOwnFeatureNote({
      featureId: FEATURE_ID,
      noteId: NOTE_ID,
      expectedUpdatedAt: T0,
      blocks,
      retainedAttachments: [],
      newFiles: [pendingFile()],
    });

    expect(result).toEqual({
      kind: "conflict",
      currentUpdatedAt: T_OTHER,
    });
    expect(db.updateCalls[1]?.filters.updated_at).toBe(T1);
  });
});
