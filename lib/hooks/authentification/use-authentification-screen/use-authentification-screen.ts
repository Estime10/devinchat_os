"use client";

import { loginUser } from "@/backend/features/01_authentification/mutations/login-user/login-user";
import { registerUser } from "@/backend/features/01_authentification/mutations/register-user/register-user";
import { initialLoginState } from "@/backend/features/01_authentification/schemas/login-state/login-state";
import { initialRegisterState } from "@/backend/features/01_authentification/schemas/register-state/register-state";
import { parseAuthMode, ROUTES, type AuthMode } from "@/lib/routes";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useCallback } from "react";

export type { AuthMode };

/**
 * Mode login/register (URL `?mode=`) + server actions + redirect post-boot.
 */
export function useAuthentificationScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = parseAuthMode(searchParams.get("mode"));

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

  const showLogin = useCallback(() => {
    router.replace(ROUTES.authWithMode("login"));
  }, [router]);

  const showRegister = useCallback(() => {
    router.replace(ROUTES.authWithMode("register"));
  }, [router]);

  const handleProgressComplete = useCallback(() => {
    router.push(ROUTES.home);
  }, [router]);

  return {
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
  };
}
