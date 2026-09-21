export type WorkspaceSelectionAction = "open" | "close" | "switch" | "ignore";

/**
 * Règle d’interaction workspace (pas du domaine métier serveur).
 */
export function resolveWorkspaceSelectionAction(input: {
  isAnimating: boolean;
  isOpen: boolean;
  selectedId: string | null;
  nextFeatureId: string;
}): WorkspaceSelectionAction {
  if (input.isAnimating) {
    return "ignore";
  }

  if (input.selectedId === input.nextFeatureId) {
    return "close";
  }

  if (input.isOpen) {
    return "switch";
  }

  return "open";
}
