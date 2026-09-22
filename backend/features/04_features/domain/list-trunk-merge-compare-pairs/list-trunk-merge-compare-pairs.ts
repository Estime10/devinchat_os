import {
  INTEGRATION_BRANCH,
  pickProductionBranch,
} from "@/backend/features/04_features/domain/resolve-branch-feature-status/resolve-branch-feature-status";

export type TrunkMergeComparePair = {
  base: string;
  head: string;
  key: string;
};

/**
 * Paires compare nécessaires à l’arbre : uniquement base ∈ {develop, main|master}.
 * O(N) — pas N² entre toutes les branches.
 */
export function listTrunkMergeComparePairs(
  branchNames: readonly string[],
): TrunkMergeComparePair[] {
  const activeSet = new Set(branchNames);
  const bases: string[] = [];

  if (activeSet.has(INTEGRATION_BRANCH)) {
    bases.push(INTEGRATION_BRANCH);
  }

  const production = pickProductionBranch(activeSet);
  if (production) {
    bases.push(production);
  }

  const pairs: TrunkMergeComparePair[] = [];

  for (const base of bases) {
    for (const head of branchNames) {
      if (head === base) {
        continue;
      }
      pairs.push({
        base,
        head,
        key: `${base}\0${head}`,
      });
    }
  }

  return pairs;
}
