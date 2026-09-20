import { isGithubConnectionActive } from "@/backend/features/02_github/domain/is-github-connection-active";
import { getOwnGithubRepo } from "@/backend/features/02_github/services/get-own-github-repo";
import { getOwnGithubConnection } from "@/backend/features/02_github/services/get-own-github-connection";
import { loadOwnRepositoryFeatures } from "@/backend/features/04_features/services/load-own-repository-features";
import { SuspenseStream } from "@/frontend/components/async/suspense-stream";
import {
  RepositoryBoot,
  RepositoryBootReady,
} from "@/frontend/features/03_repository/ui/boot/repository-boot";
import { RepositoryScreen } from "@/frontend/features/03_repository/repository-screen";
import { ROUTES } from "@/lib/routes";
import { notFound, redirect } from "next/navigation";

type RepositoryPageProps = {
  params: Promise<{ owner: string; repo: string }>;
};

/**
 * Portfolio — une barre de boot centrée jusqu’à data complètes.
 */
export default function RepositoryPage({ params }: RepositoryPageProps) {
  return (
    <RepositoryBoot>
      <SuspenseStream fallback={null}>
        <RepositoryContent params={params} />
      </SuspenseStream>
    </RepositoryBoot>
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

  const features = await loadOwnRepositoryFeatures(owner, repo);

  return (
    <>
      <RepositoryBootReady />
      <RepositoryScreen repo={result.repo} features={features} />
    </>
  );
}
