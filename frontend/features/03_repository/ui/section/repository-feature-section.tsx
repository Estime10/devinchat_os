import { Skeleton } from "@/frontend/components/layout/skeleton/skeleton";
import { SuspenseStream } from "@/frontend/components/async/suspense-stream";
import { RepositoryFeatureList } from "@/frontend/features/03_repository/ui/list/repository-feature-list";
import { RepositoryFeatureLoader } from "@/frontend/features/03_repository/ui/loader/repository-feature-loader";
import { parseGithubFullName } from "@/lib/github/commit-activity";

type RepositoryFeatureSectionProps = {
  fullName: string;
};

/**
 * Section features — compose titre + SuspenseStream + loader.
 */
export function RepositoryFeatureSection({
  fullName,
}: RepositoryFeatureSectionProps) {
  const parsed = parseGithubFullName(fullName);

  if (!parsed) {
    return <RepositoryFeatureList features={null} />;
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <p className="mb-4 shrink-0 font-sans text-xs tracking-[0.2em] text-white uppercase">
        {"// features"}
      </p>
      <SuspenseStream fallback={<Skeleton variant="list" />}>
        <RepositoryFeatureLoader owner={parsed.owner} repo={parsed.repo} />
      </SuspenseStream>
    </section>
  );
}
