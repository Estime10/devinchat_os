"use client";

import type { GithubCommitActivityMap } from "@/backend/features/02_github/types/github-commit-activity-map/github-commit-activity-map";
import type { GithubRepoListItem } from "@/backend/features/02_github/types/github-repo-list-item/github-repo-list-item";
import { API } from "@/lib/api/endpoints";
import {
  animateReposListEnter,
  animateReposListExit,
} from "@/lib/animation/github-repos/animate-repos-list";
import { prefersReducedMotion } from "@/lib/animation/prefers-reduced-motion";
import { formatAbsoluteDate } from "@/lib/format/absolute-date/absolute-date";
import { formatRelativeTime } from "@/lib/format/relative-time/relative-time";
import { parseGithubFullName } from "@/lib/github/commit-activity/commit-activity";
import { REPOS_PAGE_SIZE } from "@/lib/hooks/github/repos-page-size/repos-page-size";
import { paginate } from "@/lib/pagination/paginate";
import { ROUTES } from "@/lib/routes";
import { useEffect, useRef, useState } from "react";

export type GithubRepoColumnRow = {
  id: number;
  fullName: string;
  href: string;
  createdAtLabel: string | null;
  pushedAtLabel: string;
  weeklyCommits: number[] | null;
  isActivityLoading: boolean;
};

/**
 * Pagination + sparklines + anim liste — hors UI colonne.
 */
export function useGithubRepoColumn(
  repos: GithubRepoListItem[],
  initialActivity: GithubCommitActivityMap = {},
) {
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

    animateReposListEnter(list);
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

    if (!list || prefersReducedMotion()) {
      setPage(nextPage);
      return;
    }

    animateReposListExit(list, () => {
      setPage(nextPage);
    });
  };

  const rows: GithubRepoColumnRow[] = items.map((repo) => {
    const hasActivity = repo.fullName in activity;
    const parsed = parseGithubFullName(repo.fullName);
    const href = parsed
      ? ROUTES.repository(parsed.owner, parsed.repo)
      : repo.htmlUrl;

    return {
      id: repo.id,
      fullName: repo.fullName,
      href,
      createdAtLabel: repo.createdAt
        ? formatAbsoluteDate(repo.createdAt)
        : null,
      pushedAtLabel: repo.pushedAt
        ? formatRelativeTime(repo.pushedAt)
        : "never",
      weeklyCommits: hasActivity ? (activity[repo.fullName] ?? null) : null,
      isActivityLoading: !hasActivity,
    };
  });

  return {
    rows,
    safePage,
    totalPages,
    totalItems,
    listRef,
    goToPage,
  };
}
