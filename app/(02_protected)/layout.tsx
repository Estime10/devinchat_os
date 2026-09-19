import { canReconnectGithub } from "@/backend/features/02_github/domain/can-reconnect-github";
import { getOwnProfile } from "@/backend/features/01_authentification/services/get-own-profile";
import { getOwnGithubConnection } from "@/backend/features/02_github/services/get-own-github-connection";
import { Header } from "@/frontend/components/layout/header/header";
import { requireUser } from "@/lib/auth/require-user";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const [profile, githubConnection] = await Promise.all([
    getOwnProfile(),
    getOwnGithubConnection(),
  ]);
  const displayName =
    profile?.display_name?.trim() || user.email?.split("@")[0] || "user";

  const github = githubConnection
    ? {
        login: githubConnection.githubLogin,
        status: githubConnection.status,
        canReconnect: canReconnectGithub(githubConnection.status),
      }
    : null;

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <Header displayName={displayName} github={github} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-[var(--layout-margin-x)] pb-4">
        {children}
      </div>
    </div>
  );
}
