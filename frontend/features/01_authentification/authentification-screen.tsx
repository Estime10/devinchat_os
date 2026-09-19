"use client";

import { loginUser } from "@/backend/features/01_authentification/mutations/login-user";
import { registerUser } from "@/backend/features/01_authentification/mutations/register-user";
import { initialLoginState } from "@/backend/features/01_authentification/schemas/login-state";
import { initialRegisterState } from "@/backend/features/01_authentification/schemas/register-state";
import { GlassPanel } from "@/frontend/components/ui/glass/glass-panel";
import { LoginForm } from "@/frontend/features/01_authentification/ui/form/login-form";
import { RegistrationForm } from "@/frontend/features/01_authentification/ui/form/registration-form";
import { AuthQuotesPanel } from "@/frontend/features/01_authentification/ui/quotes/auth-quotes-panel";
import { ROUTES } from "@/lib/routes";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useState } from "react";

type AuthMode = "register" | "login";

export function AuthentificationScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");

  const [registerState, registerAction, registerPending] = useActionState(
    registerUser,
    initialRegisterState,
  );
  const [loginState, loginAction, loginPending] = useActionState(
    loginUser,
    initialLoginState,
  );

  const pending = mode === "register" ? registerPending : loginPending;
  const isSuccess = mode === "register" ? registerState.ok : loginState.ok;

  const handleProgressComplete = useCallback(() => {
    router.push(ROUTES.home);
  }, [router]);

  return (
    <main className="px-[var(--layout-margin-x)]">
      <GlassPanel>
        <div className="flex h-full w-full">
          <section
            className="h-full w-[70%]"
            aria-label="Authentification principale"
          >
            {mode === "register" ? (
              <RegistrationForm
                state={registerState}
                formAction={registerAction}
                pending={registerPending}
                onLoginClick={() => {
                  setMode("login");
                }}
              />
            ) : (
              <LoginForm
                state={loginState}
                formAction={loginAction}
                pending={loginPending}
                onRegisterClick={() => {
                  setMode("register");
                }}
              />
            )}
          </section>
          <AuthQuotesPanel
            isRegistering={pending}
            isSuccess={isSuccess}
            onProgressComplete={handleProgressComplete}
          />
        </div>
      </GlassPanel>
    </main>
  );
}
