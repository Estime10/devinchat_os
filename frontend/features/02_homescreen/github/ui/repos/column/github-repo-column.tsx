"use client";

import { StateEmpty } from "@/frontend/components/states/empty/state-empty";
import { GithubReposPagination } from "@/frontend/features/02_homescreen/github/ui/repos/pagination/github-repos-pagination";
import { REPOS_PAGE_SIZE } from "@/frontend/features/02_homescreen/github/ui/repos/repos-page-size";
import { GithubRepoRow } from "@/frontend/features/02_homescreen/github/ui/repos/row/github-repo-row";
import { API } from "@/lib/api/endpoints";
import { formatAbsoluteDate } from "@/lib/format/absolute-date";
import { formatRelativeTime } from "@/lib/format/relative-time";
import { parseGithubFullName } from "@/lib/github/commit-activity";
import { paginate } from "@/lib/pagination/paginate";
import { ROUTES } from "@/lib/routes";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

/** Item liste — type collé au consommateur colonne (DRY pour le board). */
export type GithubRepoListItem = {
  id: number;
  fullName: string;
  htmlUrl: string;
  createdAt: string | null;
  pushedAt: string | null;
};

export type GithubCommitActivityMap = Record<string, number[] | null>;

type GithubRepoColumnProps = {
  title: string;
  repos: GithubRepoListItem[];
  emptyLabel: string;
  initialActivity?: GithubCommitActivityMap;
};

/**
 * Colonne de repos — 5 / page, sparklines (SSR page 1 + fetch pages suivantes).
 */
export function GithubRepoColumn({
  title,
  repos,
  emptyLabel,
  initialActivity = {},
}: GithubRepoColumnProps) {
  const [page, setPage] = useState(1);
  const [fetchedActivity, setFetchedActivity] =
    useState<GithubCommitActivityMap>({});
  const [refreshToken, setRefreshToken] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const isFirstRender = useRef(true);

  const activity: GithubCommitActivityMap = {
    ...initialActivity,
    ...fetchedActivity,
  };

  const {
    items,
    page: safePage,
    totalPages,
    totalItems,
  } = paginate(repos, page, REPOS_PAGE_SIZE);

  useEffect(() => {
    const onFocus = () => {
      setRefreshToken((current) => current + 1);
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    gsap.fromTo(
      list,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.28, ease: "power2.out" },
    );
  }, [safePage]);

  useEffect(() => {
    const fullNames = items.map((repo) => repo.fullName);
    if (fullNames.length === 0) {
      return;
    }

    // 1er passage : uniquement les manquants (SSR). Focus / refresh : tout recharger.
    const targets =
      refreshToken === 0
        ? fullNames.filter((name) => !(name in activity))
        : fullNames;

    if (targets.length === 0) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const markMissingAsEmpty = () => {
        setFetchedActivity((current) => {
          const next = { ...current };
          for (const name of targets) {
            if (!(name in next)) {
              next[name] = null;
            }
          }
          return next;
        });
      };

      try {
        const response = await fetch(API.github.commitActivity, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullNames: targets }),
        });

        if (!response.ok || cancelled) {
          if (!cancelled) {
            markMissingAsEmpty();
          }
          return;
        }

        const payload = (await response.json()) as {
          activity?: GithubCommitActivityMap;
        };

        if (!payload.activity || cancelled) {
          if (!cancelled) {
            markMissingAsEmpty();
          }
          return;
        }

        setFetchedActivity((current) => {
          const next = { ...current, ...payload.activity };
          for (const name of targets) {
            if (!(name in next)) {
              next[name] = null;
            }
          }
          return next;
        });
      } catch {
        if (!cancelled) {
          markMissingAsEmpty();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // activity omis volontairement — sinon boucle après setFetchedActivity
    // eslint-disable-next-line react-hooks/exhaustive-deps -- items + refreshToken
  }, [items, refreshToken]);

  const goToPage = (nextPage: number) => {
    const list = listRef.current;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!list || prefersReducedMotion) {
      setPage(nextPage);
      return;
    }

    gsap.to(list, {
      opacity: 0,
      y: -8,
      duration: 0.16,
      ease: "power2.in",
      onComplete: () => {
        setPage(nextPage);
      },
    });
  };

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
            className="flex min-h-0 flex-1 flex-col [&>li:last-child_a]:border-b-0"
          >
            {items.map((repo) => {
              const hasActivity = repo.fullName in activity;
              const parsed = parseGithubFullName(repo.fullName);
              const href = parsed
                ? ROUTES.repository(parsed.owner, parsed.repo)
                : repo.htmlUrl;

              return (
                <li key={repo.id} className="flex min-h-0 flex-1">
                  <GithubRepoRow
                    fullName={repo.fullName}
                    href={href}
                    createdAtLabel={
                      repo.createdAt ? formatAbsoluteDate(repo.createdAt) : null
                    }
                    pushedAtLabel={
                      repo.pushedAt
                        ? formatRelativeTime(repo.pushedAt)
                        : "never"
                    }
                    weeklyCommits={hasActivity ? activity[repo.fullName] : null}
                    isActivityLoading={!hasActivity}
                  />
                </li>
              );
            })}
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
