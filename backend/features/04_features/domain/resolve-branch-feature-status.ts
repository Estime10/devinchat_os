const INTEGRATION_BRANCH = "develop";
const PRODUCTION_BRANCHES = ["main", "master"] as const;

export function isIntegrationBranch(branchName: string): boolean {
  return branchName === INTEGRATION_BRANCH;
}

export function isProductionBranch(branchName: string): boolean {
  return PRODUCTION_BRANCHES.includes(
    branchName as (typeof PRODUCTION_BRANCHES)[number],
  );
}

/**
 * Statut feature selon le flux git :
 * - develop → toujours in_progress
 * - main/master → done si develop y est mergé
 * - autres → done si mergé dans develop ou main/master
 */
export function resolveBranchFeatureStatus(input: {
  branchName: string;
  mergedIntoDevelop: boolean | null;
  mergedIntoProduction: boolean | null;
  developMergedIntoProduction: boolean | null;
}): "done" | "in_progress" {
  if (isIntegrationBranch(input.branchName)) {
    return "in_progress";
  }

  if (isProductionBranch(input.branchName)) {
    return input.developMergedIntoProduction === true ? "done" : "in_progress";
  }

  if (input.mergedIntoDevelop === true || input.mergedIntoProduction === true) {
    return "done";
  }

  return "in_progress";
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
