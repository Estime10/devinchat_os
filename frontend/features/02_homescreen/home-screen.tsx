import { GithubScreen } from "@/frontend/features/02_homescreen/github/github-screen";

type HomeScreenProps = {
  githubError?: string;
};

/**
 * Homescreen — délègue le domaine GitHub à GithubScreen.
 */
export async function HomeScreen({ githubError }: HomeScreenProps) {
  return <GithubScreen oauthErrorCode={githubError} />;
}
