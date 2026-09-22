import { requireUser } from "@/lib/auth/require-user";

/**
 * Layout protégé — auth only. Header = groupe `(with-header)`.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      {children}
    </div>
  );
}
