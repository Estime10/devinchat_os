import { StateEmpty } from "@/frontend/components/states/empty/state-empty";
import { GithubRepoRow } from "@/frontend/features/02_homescreen/github/ui/repos/row/github-repo-row";

/** Item liste — type collé au consommateur colonne (DRY pour le board). */
export type GithubRepoListItem = {
  id: number;
  fullName: string;
  htmlUrl: string;
  description: string | null;
};

type GithubRepoColumnProps = {
  title: string;
  repos: GithubRepoListItem[];
  emptyLabel: string;
};

/**
 * Colonne de repos (private ou public).
 */
export function GithubRepoColumn({
  title,
  repos,
  emptyLabel,
}: GithubRepoColumnProps) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="mb-4 flex items-baseline justify-between gap-3 border-b border-glass-border pb-3">
        <h2 className="font-sans text-sm font-semibold tracking-tight text-fg-default uppercase">
          {title}
        </h2>
        <span className="font-sans text-xs text-white/50 tabular-nums">
          {repos.length}
        </span>
      </header>

      {repos.length === 0 ? (
        <StateEmpty>{emptyLabel}</StateEmpty>
      ) : (
        <ul className="flex min-h-0 flex-col gap-1 overflow-y-auto">
          {repos.map((repo) => (
            <li key={repo.id}>
              <GithubRepoRow
                fullName={repo.fullName}
                htmlUrl={repo.htmlUrl}
                description={repo.description}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
