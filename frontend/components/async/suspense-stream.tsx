import type { ReactNode } from "react";
import { Suspense } from "react";

type SuspenseStreamProps = {
  children: ReactNode;
  fallback: ReactNode;
};

/**
 * Boundary de streaming RSC — une seule responsabilité (SRP).
 * Les fallbacks restent dans les features (OCP / pas de couplage domaine).
 */
export function SuspenseStream({ children, fallback }: SuspenseStreamProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
