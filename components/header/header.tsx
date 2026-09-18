"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const HEADER_HEIGHT_VAR = "--header-height";

/**
 * Header sticky. Mesure sa hauteur et l’écrit sur <html> en --header-height
 * pour que les sections puissent négocier l’espace restant :
 * min-h-[calc(100dvh-var(--header-height))]
 */
export function Header() {
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
      className="sticky top-0 z-50 border-b border-glass-border bg-glass-bg shadow-lg backdrop-blur-lg"
    >
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-6">
        <Link
          href="/home"
          className="font-sans text-sm font-semibold tracking-tight text-fg-default"
        >
          DevinChat OS
        </Link>
      </div>
    </header>
  );
}
