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
 * - done → garder le status, nullifier branch_name (historique pyramide)
 * - sinon → archived + branch_name null
 * - manual_override → ne pas toucher
 */
export function resolveStaleFeatureUpdate(
  row: StaleFeatureRow,
): StaleFeatureUpdate | null {
  if (row.manualOverride) {
    return null;
  }

  if (row.status === "done") {
    return { branch_name: null };
  }

  return { branch_name: null, status: "archived" };
}
