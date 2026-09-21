import { formatAbsoluteDate } from "@/lib/format/absolute-date";
import type { GithubRepo } from "@/lib/github/repos";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";

type RepositoryHeaderProps = {
  repo: GithubRepo;
};

/**
 * Header repository — back + identité repo.
 */
export function RepositoryHeader({ repo }: RepositoryHeaderProps) {
  const createdAtLabel = repo.createdAt
    ? formatAbsoluteDate(repo.createdAt)
    : null;

  return (
    <div className="shrink-0 space-y-2">
      <Link
        href={ROUTES.home}
        className="font-sans text-xs tracking-tight text-fg-muted uppercase transition-colors hover:text-fg-default"
      >
        [ back ]
      </Link>
      <h1 className="font-sans text-xl font-semibold tracking-tight text-white">
        {repo.fullName}
      </h1>
      <p className="font-sans text-sm text-white/50 uppercase">
        {repo.isPrivate ? "private" : "public"}
        {createdAtLabel ? ` · ${createdAtLabel}` : null}
      </p>
    </div>
  );
}
