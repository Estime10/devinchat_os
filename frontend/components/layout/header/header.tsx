"use client";

import { logoutUser } from "@/backend/features/01_authentification/mutations/logout-user";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { useEffect, useRef } from "react";

const HEADER_HEIGHT_VAR = "--header-height";

type HeaderProps = {
  displayName: string;
};

/**
 * Header sticky — logo gauche, display_name centre (uppercase), logout droite.
 */
export function Header({ displayName }: HeaderProps) {
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
          className="font-sans text-sm font-semibold tracking-tight text-fg-default"
        >
          DevinChat OS
        </Link>

        <p className="pointer-events-none absolute left-1/2 -translate-x-1/2 font-sans text-sm tracking-tight text-fg-default uppercase">
          <span className="text-fg-dim">@</span>
          {displayName}
        </p>

        <form action={logoutUser}>
          <button
            type="submit"
            className="cursor-pointer font-sans text-sm tracking-tight text-fg-muted uppercase transition-colors hover:text-fg-default"
          >
            [ logout ]
          </button>
        </form>
      </div>
    </header>
  );
}
