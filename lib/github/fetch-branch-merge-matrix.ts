import { fetchIsBranchMergedInto } from "@/lib/github/is-branch-merged-into";
import { listTrunkMergeComparePairs } from "@/lib/github/list-trunk-merge-compare-pairs";

/**
 * Matrice base←head limitée aux trunks (develop / main|master) — O(N) compares.
 */
export async function fetchBranchMergeMatrix(input: {
  accessToken: string;
  owner: string;
  repo: string;
  branchNames: readonly string[];
  concurrency?: number;
}): Promise<Map<string, boolean>> {
  const { accessToken, owner, repo, branchNames } = input;
  const concurrency = input.concurrency ?? 6;
  const pairs = listTrunkMergeComparePairs(branchNames);
  const results = new Map<string, boolean>();

  for (let index = 0; index < pairs.length; index += concurrency) {
    const batch = pairs.slice(index, index + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (pair) => {
        const merged = await fetchIsBranchMergedInto({
          accessToken,
          owner,
          repo,
          base: pair.base,
          head: pair.head,
        });
        return { key: pair.key, merged: merged === true };
      }),
    );

    for (const result of batchResults) {
      results.set(result.key, result.merged);
    }
  }

  return results;
}

export function mergeMatrixLookup(
  matrix: Map<string, boolean>,
): (base: string, head: string) => boolean {
  return (base, head) => matrix.get(`${base}\0${head}`) === true;
}
