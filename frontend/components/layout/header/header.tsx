"use client";

import { logoutUser } from "@/backend/features/01_authentification/mutations/logout-user";
import { ReconnectGithubActions } from "@/frontend/features/02_homescreen/github/ui/actions/reconnect-github-actions";
import { GithubConnectionBadge } from "@/frontend/features/02_homescreen/github/ui/badge/github-connection-badge";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { useEffect, useRef } from "react";

const HEADER_HEIGHT_VAR = "--header-height";

type HeaderGithubConnection = {
  login: string;
  status: string;
  canReconnect: boolean;
};

type HeaderProps = {
  /** Fallback centre si GitHub non connecté. */
  displayName: string;
  github?: HeaderGithubConnection | null;
};

const headerLinkClassName =
  "cursor-pointer font-sans text-sm tracking-tight text-fg-muted uppercase transition-colors hover:text-fg-default";

/**
 * Header — logo | github centré | reconnect + logout.
 */
export function Header({ displayName, github = null }: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) {
      return;
    }

    const syncHeaderHeight = () => {
      const height = header.getBoundingClientRect().height;
      document.documentElement.style.setProperty(
        HEADER_HEIGHT_VAR,
        `${height}px`,
      );
    };

    syncHeaderHeight();

    const observer = new ResizeObserver(syncHeaderHeight);
    observer.observe(header);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty(HEADER_HEIGHT_VAR);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 w-full border-b border-glass-border bg-glass-bg backdrop-blur-lg"
    >
      <div className="relative flex h-14 w-full items-center justify-between px-[var(--layout-margin-x)]">
        <Link
          href={ROUTES.home}
          className="relative z-10 shrink-0 font-sans text-sm font-semibold tracking-tight text-fg-default"
        >
          DevinChat OS
        </Link>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-40">
          <div className="pointer-events-auto max-w-full">
            {github ? (
              <GithubConnectionBadge
                login={github.login}
                status={github.status}
                canReconnect={github.canReconnect}
                variant="header"
              />
            ) : (
              <p className="truncate text-center font-sans text-sm tracking-tight text-white uppercase">
                <span className="text-white/50">github </span>
                <span className="text-danger-fg">disconnected</span>
                <span className="text-white/40"> · </span>
                <span className="text-fg-dim">@{displayName}</span>
              </p>
            )}
          </div>
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-4">
          {github ? (
            <ReconnectGithubActions
              canReconnect={github.canReconnect}
              variant="link"
            />
          ) : null}
          <form action={logoutUser}>
            <button type="submit" className={headerLinkClassName}>
              [ logout ]
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
