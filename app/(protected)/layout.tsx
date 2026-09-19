import { getOwnProfile } from "@/backend/authentification/services/get-own-profile";
import { Header } from "@/components/layout/header/header";
import { requireUser } from "@/lib/auth/require-user";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const profile = await getOwnProfile();
  const displayName =
    profile?.display_name?.trim() || user.email?.split("@")[0] || "user";

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <Header displayName={displayName} />
      <div className="flex min-h-[calc(100dvh-var(--header-height))] flex-1 flex-col px-[var(--layout-margin-x)]">
        {children}
      </div>
    </div>
  );
}
