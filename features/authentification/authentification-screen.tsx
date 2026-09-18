"use client";

import { registerUser } from "@/backend/authentification/mutations/register-user";
import { initialRegisterState } from "@/backend/authentification/schemas/register-state";
import { GlassPanel } from "@/components/ui/glass/glass-panel";
import { RegistrationForm } from "@/features/authentification/ui/form/registration-form";
import { AuthQuotesPanel } from "@/features/authentification/ui/quotes/auth-quotes-panel";
import { useRouter } from "next/navigation";
import { useActionState, useCallback } from "react";

export function AuthentificationScreen() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    registerUser,
    initialRegisterState,
  );

  const handleProgressComplete = useCallback(() => {
    router.push("/home");
  }, [router]);

  return (
    <main className="px-[var(--layout-margin-x)]">
      <GlassPanel>
        <div className="flex h-full w-full">
          <section
            className="h-full w-[70%]"
            aria-label="Authentification principale"
          >
            <RegistrationForm
              state={state}
              formAction={formAction}
              pending={pending}
            />
          </section>
          <AuthQuotesPanel
            isRegistering={pending}
            isSuccess={state.ok}
            onProgressComplete={handleProgressComplete}
          />
        </div>
      </GlassPanel>
    </main>
  );
}
