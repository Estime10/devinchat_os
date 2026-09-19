import { HomeScreen } from "@/frontend/features/02_homescreen/home-screen";

type HomePageProps = {
  searchParams: Promise<{ github_error?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  return <HomeScreen githubError={params.github_error} />;
}
