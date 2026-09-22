import {
  isIntegrationBranch,
  isProductionBranch,
} from "@/backend/features/04_features/domain/resolve-branch-feature-status/resolve-branch-feature-status";

function isMergedIntoAnyTrunk(
  branchName: string,
  branchNames: readonly string[],
  isMergedInto: (base: string, head: string) => boolean,
): boolean {
  if (branchNames.includes("develop") && isMergedInto("develop", branchName)) {
    return true;
  }
  if (branchNames.includes("main") && isMergedInto("main", branchName)) {
    return true;
  }
  if (branchNames.includes("master") && isMergedInto("master", branchName)) {
    return true;
  }
  return false;
}

/**
 * Branche dans laquelle celle-ci est mergée.
 *
 * Open→open : uniquement via PR mergée (événement de merge réel).
 * Trunk : compare GitHub (ahead_by).
 * Jamais de heuristique de dates.
 */
export function resolveMergedIntoBranch(input: {
  branchName: string;
  branchNames: readonly string[];
  isMergedInto: (base: string, head: string) => boolean;
  pullParentByHead?: ReadonlyMap<string, string>;
}): string | null {
  const { branchName, branchNames, isMergedInto, pullParentByHead } = input;

  if (isProductionBranch(branchName)) {
    return null;
  }

  const pullParent = pullParentByHead?.get(branchName);
  if (pullParent && pullParent !== branchName) {
    return pullParent;
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

  // Encore open (pas dans develop/main) : sans PR, pas de parent inventé.
  if (!isMergedIntoAnyTrunk(branchName, branchNames, isMergedInto)) {
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

export function breakParentCycles(
  parents: Map<string, string | null>,
  isMergedInto: (base: string, head: string) => boolean,
): void {
  for (const [head, parent] of [...parents.entries()]) {
    if (!parent) {
      continue;
    }
    if (parents.get(parent) !== head) {
      continue;
    }

    const headIntoParent = isMergedInto(parent, head);
    const parentIntoHead = isMergedInto(head, parent);

    if (headIntoParent && !parentIntoHead) {
      parents.set(parent, null);
    } else if (parentIntoHead && !headIntoParent) {
      parents.set(head, null);
    } else {
      parents.set(head, null);
      parents.set(parent, null);
    }
  }
}

export function buildBranchParentMap(input: {
  branchNames: readonly string[];
  isMergedInto: (base: string, head: string) => boolean;
  pullParentByHead?: ReadonlyMap<string, string>;
}): Map<string, string | null> {
  const parents = new Map<string, string | null>();

  for (const branchName of input.branchNames) {
    parents.set(
      branchName,
      resolveMergedIntoBranch({
        branchName,
        branchNames: input.branchNames,
        isMergedInto: input.isMergedInto,
        pullParentByHead: input.pullParentByHead,
      }),
    );
  }

  breakParentCycles(parents, input.isMergedInto);
  return parents;
}
