import { AuthentificationScreen } from "@/frontend/features/01_authentification/authentification-screen";
import { Suspense } from "react";

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthentificationScreen />
    </Suspense>
  );
}
