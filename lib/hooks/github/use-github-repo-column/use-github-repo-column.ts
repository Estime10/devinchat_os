"use client";

import {
  EMPTY_GITHUB_COMMIT_ACTIVITY_MAP,
  type GithubCommitActivityMap,
} from "@/backend/features/02_github/types/github-commit-activity-map/github-commit-activity-map";
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

/** Min delay between focus-triggered sparkline refreshes. */
const FOCUS_REFRESH_COOLDOWN_MS = 60_000;
/** Retry quand GitHub renvoie encore null (stats 202). */
const NULL_ACTIVITY_RETRY_MS = 2_500;
const NULL_ACTIVITY_MAX_RETRIES = 2;

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
  initialActivity: GithubCommitActivityMap = EMPTY_GITHUB_COMMIT_ACTIVITY_MAP,
) {
  const [page, setPage] = useState(1);
  const [fetchedActivity, setFetchedActivity] =
    useState<GithubCommitActivityMap>({});
  const [refreshToken, setRefreshToken] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const isFirstRender = useRef(true);
  const loadedKeysRef = useRef<Set<string>>(
    new Set(
      Object.entries(initialActivity)
        .filter(([, weeks]) => Array.isArray(weeks))
        .map(([name]) => name),
    ),
  );
  const nullRetryCountRef = useRef<Map<string, number>>(new Map());
  const lastFocusRefreshAtRef = useRef(0);

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

  // Clé stable — `items` est un nouveau tableau à chaque render.
  const pageKey = items.map((repo) => repo.fullName).join("\0");

  useEffect(() => {
    const onFocus = () => {
      const now = Date.now();
      if (now - lastFocusRefreshAtRef.current < FOCUS_REFRESH_COOLDOWN_MS) {
        return;
      }
      lastFocusRefreshAtRef.current = now;
      for (const name of pageKey.split("\0")) {
        if (name.length > 0) {
          loadedKeysRef.current.delete(name);
          nullRetryCountRef.current.delete(name);
        }
      }
      setRefreshToken((current) => current + 1);
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [pageKey]);

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
    const fullNames =
      pageKey.length === 0 ? [] : pageKey.split("\0").filter(Boolean);
    if (fullNames.length === 0) {
      return;
    }

    const targets = fullNames.filter(
      (name) => !loadedKeysRef.current.has(name),
    );
    if (targets.length === 0) {
      return;
    }

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    void (async () => {
      try {
        const response = await fetch(API.github.commitActivity, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullNames: targets }),
          cache: "no-store",
        });

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          for (const name of targets) {
            loadedKeysRef.current.add(name);
          }
          setFetchedActivity((current) => {
            const next = { ...current };
            for (const name of targets) {
              if (!(name in next)) {
                next[name] = null;
              }
            }
            return next;
          });
          return;
        }

        const payload = (await response.json()) as {
          activity?: GithubCommitActivityMap;
        };
        const map = payload.activity ?? {};
        const retryNames: string[] = [];
        const patch: GithubCommitActivityMap = {};

        for (const name of targets) {
          const weeks = map[name];
          if (Array.isArray(weeks)) {
            patch[name] = weeks;
            loadedKeysRef.current.add(name);
            nullRetryCountRef.current.delete(name);
            continue;
          }
          patch[name] = null;
          const retries = nullRetryCountRef.current.get(name) ?? 0;
          if (retries < NULL_ACTIVITY_MAX_RETRIES) {
            nullRetryCountRef.current.set(name, retries + 1);
            retryNames.push(name);
          } else {
            loadedKeysRef.current.add(name);
          }
        }

        setFetchedActivity((current) => ({ ...current, ...patch }));

        if (retryNames.length > 0 && !cancelled) {
          retryTimer = setTimeout(() => {
            setFetchedActivity((current) => {
              const next = { ...current };
              for (const name of retryNames) {
                delete next[name];
                loadedKeysRef.current.delete(name);
              }
              return next;
            });
            setRefreshToken((current) => current + 1);
          }, NULL_ACTIVITY_RETRY_MS);
        }
      } catch {
        if (!cancelled) {
          for (const name of targets) {
            loadedKeysRef.current.add(name);
          }
          setFetchedActivity((current) => {
            const next = { ...current };
            for (const name of targets) {
              if (!(name in next)) {
                next[name] = null;
              }
            }
            return next;
          });
        }
      }
    })();

    return () => {
      cancelled = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [pageKey, refreshToken]);

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
    const weeks = activity[repo.fullName];
    const hasActivityEntry = repo.fullName in activity;
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
      weeklyCommits: Array.isArray(weeks) ? weeks : null,
      isActivityLoading: !hasActivityEntry,
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
