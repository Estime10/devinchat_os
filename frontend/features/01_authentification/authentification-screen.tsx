"use client";

import { GlassPanel } from "@/frontend/components/ui/glass/glass-panel";
import { LoginForm } from "@/frontend/features/01_authentification/ui/form/login-form/login-form";
import { RegistrationForm } from "@/frontend/features/01_authentification/ui/form/registration-form/registration-form";
import { AuthQuotesPanel } from "@/frontend/features/01_authentification/ui/quotes/auth-quotes-panel";
import { useAuthentificationScreen } from "@/lib/hooks/authentification/use-authentification-screen/use-authentification-screen";

/**
 * Présentation auth — état dans useAuthentificationScreen.
 */
export function AuthentificationScreen() {
  const {
    mode,
    registerState,
    registerAction,
    registerPending,
    loginState,
    loginAction,
    loginPending,
    pending,
    isSuccess,
    showLogin,
    showRegister,
    handleProgressComplete,
  } = useAuthentificationScreen();

  return (
    <main className="px-layout-margin-x">
      <GlassPanel>
        <div className="flex h-full w-full">
          <section
            className="auth-split-form"
            aria-label="Authentification principale"
          >
            {mode === "register" ? (
              <RegistrationForm
                state={registerState}
                formAction={registerAction}
                pending={registerPending}
                onLoginClick={showLogin}
              />
            ) : (
              <LoginForm
                state={loginState}
                formAction={loginAction}
                pending={loginPending}
                onRegisterClick={showRegister}
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
