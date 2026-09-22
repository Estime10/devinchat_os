"use client";

import { loginUser } from "@/backend/features/01_authentification/mutations/login-user/login-user";
import { registerUser } from "@/backend/features/01_authentification/mutations/register-user/register-user";
import { initialLoginState } from "@/backend/features/01_authentification/schemas/login-state/login-state";
import { initialRegisterState } from "@/backend/features/01_authentification/schemas/register-state/register-state";
import { ROUTES } from "@/lib/routes";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useState } from "react";

export type AuthMode = "register" | "login";

/**
 * Mode login/register + server actions + redirect post-boot — hors UI.
 */
export function useAuthentificationScreen() {
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

  const showLogin = () => {
    setMode("login");
  };

  const showRegister = () => {
    setMode("register");
  };

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
