import { isMergedFeatureStatus } from "@/backend/features/04_features/domain/resolve-branch-feature-status/resolve-branch-feature-status";

export type StaleFeatureRow = {
  status: string;
  manualOverride: boolean;
};

export type StaleFeatureUpdate = {
  branch_name: null;
  status?: "archived";
};

/**
 * Branche absente sur GitHub :
 * - merged (legacy done) → garder le status, nullifier branch_name (historique arbre)
 * - sinon → archived + branch_name null
 * - manual_override → ne pas toucher
 */
export function resolveStaleFeatureUpdate(
  row: StaleFeatureRow,
): StaleFeatureUpdate | null {
  if (row.manualOverride) {
    return null;
  }

  if (isMergedFeatureStatus(row.status)) {
    return { branch_name: null };
  }

  return { branch_name: null, status: "archived" };
}
