import { isGithubConnectionActive } from "@/backend/features/02_github/domain/is-github-connection-active/is-github-connection-active";
import { getOwnGithubRepo } from "@/backend/features/02_github/services/get-own-github-repo/get-own-github-repo";
import { getOwnGithubConnection } from "@/backend/features/02_github/services/get-own-github-connection/get-own-github-connection";
import { countOwnFeatureNotes } from "@/backend/features/04_features/services/count-own-feature-notes/count-own-feature-notes";
import { loadOwnRepositoryFeatures } from "@/backend/features/04_features/services/load-own-repository-features/load-own-repository-features";
import { SuspenseStream } from "@/frontend/components/async/suspense-stream";
import { Boot, BootReady } from "@/frontend/components/boot/boot/boot";
import { repositoryBootProgress } from "@/frontend/components/boot/presets/presets";
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
    <Boot {...repositoryBootProgress}>
      <SuspenseStream fallback={null}>
        <RepositoryContent params={params} />
      </SuspenseStream>
    </Boot>
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

  const featuresResult = await loadOwnRepositoryFeatures(owner, repo);

  if (featuresResult.kind === "unauthorized") {
    redirect(`${ROUTES.home}?github_error=expired`);
  }

  const features =
    featuresResult.kind === "ok" ? featuresResult.features : null;
  const noteCountByFeatureId =
    features === null
      ? {}
      : await countOwnFeatureNotes(features.map((feature) => feature.id));

  return (
    <>
      <BootReady />
      <RepositoryScreen
        repo={result.repo}
        features={features}
        noteCountByFeatureId={noteCountByFeatureId}
      />
    </>
  );
}
