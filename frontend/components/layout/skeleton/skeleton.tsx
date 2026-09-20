import { SkeletonLine } from "@/frontend/components/layout/skeleton/skeleton-line";
import { SkeletonList } from "@/frontend/components/layout/skeleton/skeleton-list";
import { SkeletonReposBoard } from "@/frontend/components/layout/skeleton/skeleton-repos-board";
import { SkeletonRepositoryPage } from "@/frontend/components/layout/skeleton/skeleton-repository-page";

export type SkeletonVariant =
  "line" | "list" | "repos-board" | "repository-page";

type SkeletonProps = {
  variant: SkeletonVariant;
  className?: string;
  rows?: number;
};

/**
 * Skeleton layout — variants partagés (pas dans les features).
 */
export function Skeleton({ variant, className = "", rows }: SkeletonProps) {
  switch (variant) {
    case "line":
      return <SkeletonLine className={className} />;
    case "list":
      return <SkeletonList rows={rows} />;
    case "repos-board":
      return <SkeletonReposBoard rows={rows} />;
    case "repository-page":
      return <SkeletonRepositoryPage />;
  }
}
