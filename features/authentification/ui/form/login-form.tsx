"use client";

import type { LoginState } from "@/backend/authentification/schemas/login-state";
import { LoginActions } from "@/features/authentification/ui/actions/login-actions";
import { AuthField } from "@/features/authentification/ui/field/auth-field";
import { LoginHeader } from "@/features/authentification/ui/header/login-header";

type LoginFormProps = {
  state: LoginState;
  formAction: (payload: FormData) => void;
  pending: boolean;
  onRegisterClick: () => void;
};

export function LoginForm({
  state,
  formAction,
  pending,
  onRegisterClick,
}: LoginFormProps) {
  return (
    <form
      action={formAction}
      className="flex h-full w-full flex-col justify-center gap-8 px-6 py-10 sm:px-10 md:px-14"
    >
      <LoginHeader />

      <div className="flex flex-col gap-5">
        <AuthField
          label="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="root@devinchat.os"
          error={state.fieldErrors.email}
        />
        <AuthField
          label="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={state.fieldErrors.password}
        />
      </div>

      {!state.ok && state.message ? (
        <p className="font-sans text-sm text-danger-fg" role="status">
          {state.message}
        </p>
      ) : null}

      <LoginActions pending={pending} onRegisterClick={onRegisterClick} />
    </form>
  );
}
