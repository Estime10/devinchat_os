import { Skeleton } from "@/frontend/components/layout/skeleton/skeleton/skeleton";
import { SuspenseStream } from "@/frontend/components/async/suspense-stream";
import { HomeScreen } from "@/frontend/features/02_homescreen/home-screen";

type HomePageProps = {
  searchParams: Promise<{ github_error?: string }>;
};

/**
 * /home — une seule boundary Suspense (évite skeleton → board → remount).
 */
export default function HomePage({ searchParams }: HomePageProps) {
  return (
    <SuspenseStream fallback={<Skeleton variant="repos-board" />}>
      <HomeContent searchParams={searchParams} />
    </SuspenseStream>
  );
}

async function HomeContent({ searchParams }: HomePageProps) {
  const params = await searchParams;
  return <HomeScreen githubError={params.github_error} />;
}
