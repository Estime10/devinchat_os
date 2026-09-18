import { Header } from "@/components/header/header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <Header />
      <div className="flex min-h-[calc(100dvh-var(--header-height))] flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
