import {
  isIntegrationBranch,
  isProductionBranch,
} from "@/lib/github/resolve-branch-feature-status";

/**
 * Branche dans laquelle celle-ci est mergée (label affichage).
 * Priorité : develop → main → master.
 */
export function resolveMergedIntoBranch(input: {
  branchName: string;
  branchNames: readonly string[];
  isMergedInto: (base: string, head: string) => boolean;
}): string | null {
  const { branchName, branchNames, isMergedInto } = input;

  if (isProductionBranch(branchName)) {
    return null;
  }

  if (isIntegrationBranch(branchName)) {
    if (branchNames.includes("main") && isMergedInto("main", branchName)) {
      return "main";
    }
    if (branchNames.includes("master") && isMergedInto("master", branchName)) {
      return "master";
    }
    return null;
  }

  if (branchNames.includes("develop") && isMergedInto("develop", branchName)) {
    return "develop";
  }
  if (branchNames.includes("main") && isMergedInto("main", branchName)) {
    return "main";
  }
  if (branchNames.includes("master") && isMergedInto("master", branchName)) {
    return "master";
  }

  return null;
}

/**
 * Map branch → branche de merge (parent_branch_name).
 */
export function buildBranchParentMap(input: {
  branchNames: readonly string[];
  isMergedInto: (base: string, head: string) => boolean;
}): Map<string, string | null> {
  const parents = new Map<string, string | null>();

  for (const branchName of input.branchNames) {
    parents.set(
      branchName,
      resolveMergedIntoBranch({
        branchName,
        branchNames: input.branchNames,
        isMergedInto: input.isMergedInto,
      }),
    );
  }

  return parents;
}
