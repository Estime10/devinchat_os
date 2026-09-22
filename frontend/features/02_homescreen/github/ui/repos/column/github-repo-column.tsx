"use client";

import {
  EMPTY_GITHUB_COMMIT_ACTIVITY_MAP,
  type GithubCommitActivityMap,
} from "@/backend/features/02_github/types/github-commit-activity-map/github-commit-activity-map";
import type { GithubRepoListItem } from "@/backend/features/02_github/types/github-repo-list-item/github-repo-list-item";
import { StateEmpty } from "@/frontend/components/states/empty/state-empty";
import { GithubReposPagination } from "@/frontend/features/02_homescreen/github/ui/repos/pagination/github-repos-pagination";
import { GithubRepoRow } from "@/frontend/features/02_homescreen/github/ui/repos/row/github-repo-row";
import { useGithubRepoColumn } from "@/lib/hooks/github/use-github-repo-column/use-github-repo-column";

type GithubRepoColumnProps = {
  title: string;
  repos: GithubRepoListItem[];
  emptyLabel: string;
  initialActivity?: GithubCommitActivityMap;
};

/**
 * Présentation colonne repos — état dans useGithubRepoColumn.
 */
export function GithubRepoColumn({
  title,
  repos,
  emptyLabel,
  initialActivity = EMPTY_GITHUB_COMMIT_ACTIVITY_MAP,
}: GithubRepoColumnProps) {
  const { rows, safePage, totalPages, totalItems, listRef, goToPage } =
    useGithubRepoColumn(repos, initialActivity);

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <header className="mb-4 flex shrink-0 items-baseline justify-between gap-3 border-b border-glass-border pb-4">
        <h2 className="font-sans text-base font-semibold tracking-tight text-fg-default uppercase">
          {title}
        </h2>
        <span className="font-sans text-sm text-white/50 tabular-nums">
          {totalItems}
        </span>
      </header>

      {totalItems === 0 ? (
        <StateEmpty>{emptyLabel}</StateEmpty>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <ul
            ref={listRef}
            className="flex min-h-0 flex-1 flex-col overflow-y-auto [&>li:last-child_a]:border-b-0"
          >
            {rows.map((row) => (
              <li key={row.id} className="shrink-0">
                <GithubRepoRow
                  fullName={row.fullName}
                  href={row.href}
                  createdAtLabel={row.createdAtLabel}
                  pushedAtLabel={row.pushedAtLabel}
                  weeklyCommits={row.weeklyCommits}
                  isActivityLoading={row.isActivityLoading}
                />
              </li>
            ))}
          </ul>

          <GithubReposPagination
            page={safePage}
            totalPages={totalPages}
            onPrevious={() => {
              goToPage(Math.max(1, safePage - 1));
            }}
            onNext={() => {
              goToPage(Math.min(totalPages, safePage + 1));
            }}
          />
        </div>
      )}
    </section>
  );
}
