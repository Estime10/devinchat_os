import { isGithubConnectionActive } from "@/backend/features/02_github/domain/is-github-connection-active";
import { getOwnGithubRepo } from "@/backend/features/02_github/services/get-own-github-repo";
import { getOwnGithubConnection } from "@/backend/features/02_github/services/get-own-github-connection";
import { SuspenseStream } from "@/frontend/components/async/suspense-stream";
import { Skeleton } from "@/frontend/components/layout/skeleton/skeleton";
import { RepositoryScreen } from "@/frontend/features/03_repository/repository-screen";
import { ROUTES } from "@/lib/routes";
import { notFound, redirect } from "next/navigation";

type RepositoryPageProps = {
  params: Promise<{ owner: string; repo: string }>;
};

/**
 * Portfolio /repository/[owner]/[repo]
 * Shell repo (liste cachée) → Suspense features (sync caché 60s).
 */
export default function RepositoryPage({ params }: RepositoryPageProps) {
  return (
    <SuspenseStream fallback={<Skeleton variant="repository-page" />}>
      <RepositoryContent params={params} />
    </SuspenseStream>
  );
}

async function RepositoryContent({ params }: RepositoryPageProps) {
  const connection = await getOwnGithubConnection();
  if (!isGithubConnectionActive(connection)) {
    redirect(
      connection?.status === "expired"
        ? `${ROUTES.home}?github_error=expired`
        : ROUTES.home,
    );
  }

  const { owner, repo } = await params;
  const result = await getOwnGithubRepo(owner, repo);

  if (result.kind === "unauthorized") {
    redirect(`${ROUTES.home}?github_error=expired`);
  }

  if (result.kind !== "ok") {
    notFound();
  }

  return <RepositoryScreen repo={result.repo} />;
}
