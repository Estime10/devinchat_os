"use client";

import { Button } from "@/frontend/components/ui/button/button";

type GithubReposPaginationProps = {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
};

/**
 * Contrôles pagination repos — barre compacte sous la liste.
 */
export function GithubReposPagination({
  page,
  totalPages,
  onPrevious,
  onNext,
}: GithubReposPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex shrink-0 items-center justify-between gap-3 border-t border-glass-border pt-3"
    >
      <Button
        type="button"
        onClick={onPrevious}
        disabled={page <= 1}
        className="px-3 py-1.5 text-xs"
      >
        [ prev ]
      </Button>

      <p className="font-sans text-xs text-white uppercase tabular-nums">
        page{" "}
        <span className="text-fg-default">
          {page}/{totalPages}
        </span>
      </p>

      <Button
        type="button"
        onClick={onNext}
        disabled={page >= totalPages}
        className="px-3 py-1.5 text-xs"
      >
        [ next ]
      </Button>
    </nav>
  );
}
