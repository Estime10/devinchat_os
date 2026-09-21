import { resolveWorkspaceSelectionAction } from "@/lib/hooks/repository/resolve-workspace-selection-action";
import { describe, expect, it } from "vitest";

describe("resolveWorkspaceSelectionAction", () => {
  it("ignore pendant une animation", () => {
    expect(
      resolveWorkspaceSelectionAction({
        isAnimating: true,
        isOpen: false,
        selectedId: null,
        nextFeatureId: "a",
      }),
    ).toBe("ignore");
  });

  it("close si même feature déjà sélectionnée", () => {
    expect(
      resolveWorkspaceSelectionAction({
        isAnimating: false,
        isOpen: true,
        selectedId: "a",
        nextFeatureId: "a",
      }),
    ).toBe("close");
  });

  it("switch si panneau ouvert sur une autre feature", () => {
    expect(
      resolveWorkspaceSelectionAction({
        isAnimating: false,
        isOpen: true,
        selectedId: "a",
        nextFeatureId: "b",
      }),
    ).toBe("switch");
  });

  it("open si panneau fermé", () => {
    expect(
      resolveWorkspaceSelectionAction({
        isAnimating: false,
        isOpen: false,
        selectedId: null,
        nextFeatureId: "a",
      }),
    ).toBe("open");
  });
});
