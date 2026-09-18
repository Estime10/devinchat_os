"use client";

import { loginUser } from "@/backend/authentification/mutations/login-user";
import { registerUser } from "@/backend/authentification/mutations/register-user";
import { initialLoginState } from "@/backend/authentification/schemas/login-state";
import { initialRegisterState } from "@/backend/authentification/schemas/register-state";
import { GlassPanel } from "@/components/ui/glass/glass-panel";
import { LoginForm } from "@/features/authentification/ui/form/login-form";
import { RegistrationForm } from "@/features/authentification/ui/form/registration-form";
import { AuthQuotesPanel } from "@/features/authentification/ui/quotes/auth-quotes-panel";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useState } from "react";

type AuthMode = "register" | "login";

export function AuthentificationScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("register");

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
