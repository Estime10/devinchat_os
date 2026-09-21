import type { GithubCommitActivityMap } from "@/backend/features/02_github/types/github-commit-activity-map";
import type { GithubRepoListItem } from "@/backend/features/02_github/types/github-repo-list-item";
import { GithubRepoColumn } from "@/frontend/features/02_homescreen/github/ui/repos/column/github-repo-column";

type GithubReposBoardProps = {
  privateRepos: GithubRepoListItem[];
  publicRepos: GithubRepoListItem[];
  initialActivity?: GithubCommitActivityMap;
};

/**
 * Board repos — private | public, colonnes pleine hauteur.
 */
export function GithubReposBoard({
  privateRepos,
  publicRepos,
  initialActivity = {},
}: GithubReposBoardProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden">
      <p className="shrink-0 font-sans text-xs tracking-[0.2em] text-white uppercase">
        {"// repositories"}
      </p>

      <div className="grid min-h-0 flex-1 gap-8 overflow-hidden lg:grid-cols-2 lg:gap-14">
        <GithubRepoColumn
          title="private"
          repos={privateRepos}
          emptyLabel="No private repositories."
          initialActivity={initialActivity}
        />
        <GithubRepoColumn
          title="public"
          repos={publicRepos}
          emptyLabel="No public repositories."
          initialActivity={initialActivity}
        />
      </div>
    </div>
  );
}
