import { Header } from "@/components/layout/header/header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <Header />
      <div className="flex min-h-[calc(100dvh-var(--header-height))] flex-1 flex-col px-[var(--layout-margin-x)]">
        {children}
      </div>
    </div>
  );
}
