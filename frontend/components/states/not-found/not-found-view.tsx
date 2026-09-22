import { ROUTES } from "@/lib/routes";
import Link from "next/link";

type NotFoundViewProps = {
  title?: string;
  description?: string;
  href?: string;
  linkLabel?: string;
};

/**
 * Vue 404 — présentation pure, réutilisable (root + segments).
 */
export function NotFoundView({
  title = "not found",
  description = "This page does not exist or you do not have access.",
  href = ROUTES.home,
  linkLabel = "[ back home ]",
}: NotFoundViewProps) {
  return (
    <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-layout-margin-x py-10">
      <div className="space-y-3 text-center">
        <p className="font-sans text-xs tracking-[0.2em] text-white/40 uppercase">
          {"// 404"}
        </p>
        <h1 className="font-sans text-2xl font-semibold tracking-tight text-fg-default uppercase">
          {title}
        </h1>
        <p className="max-w-md font-sans text-sm text-white/50">
          {description}
        </p>
      </div>

      <Link
        href={href}
        className="font-sans text-sm tracking-tight text-fg-muted uppercase transition-colors hover:text-fg-default"
      >
        {linkLabel}
      </Link>
    </main>
  );
}
