const INTEGRATION_BRANCH = "develop";
const PRODUCTION_BRANCHES = ["main", "master"] as const;

export type RuntimeFeatureStatus = "committed" | "merged";

/** Merged history (incl. legacy `done` encore en DB avant prochain sync). */
export function isMergedFeatureStatus(status: string): boolean {
  return status === "merged" || status === "done";
}

export function isIntegrationBranch(branchName: string): boolean {
  return branchName === INTEGRATION_BRANCH;
}

export function isProductionBranch(branchName: string): boolean {
  return PRODUCTION_BRANCHES.includes(
    branchName as (typeof PRODUCTION_BRANCHES)[number],
  );
}

/**
 * Statut feature selon le flux git (pas le travail humain) :
 * - develop → toujours committed
 * - main/master → merged si develop y est mergé
 * - autres → merged si mergé dans develop ou main/master
 *
 * `committed` = branche ouverte / pas encore dans le trunk cible.
 * On ne distingue pas encore « zéro commit unique » (ahead_by) — V1 suffisant.
 */
export function resolveBranchFeatureStatus(input: {
  branchName: string;
  mergedIntoDevelop: boolean | null;
  mergedIntoProduction: boolean | null;
  developMergedIntoProduction: boolean | null;
}): RuntimeFeatureStatus {
  if (isIntegrationBranch(input.branchName)) {
    return "committed";
  }

  if (isProductionBranch(input.branchName)) {
    return input.developMergedIntoProduction === true ? "merged" : "committed";
  }

  if (input.mergedIntoDevelop === true || input.mergedIntoProduction === true) {
    return "merged";
  }

  return "committed";
}

export function pickProductionBranch(
  branchNames: ReadonlySet<string>,
): "main" | "master" | null {
  if (branchNames.has("main")) {
    return "main";
  }
  if (branchNames.has("master")) {
    return "master";
  }
  return null;
}

export { INTEGRATION_BRANCH };
