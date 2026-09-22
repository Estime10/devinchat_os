export type GithubCommitActivityMap = Record<string, number[] | null>;

/** Empty map stable across renders — safe default prop / effect deps. */
export const EMPTY_GITHUB_COMMIT_ACTIVITY_MAP: GithubCommitActivityMap = {};
