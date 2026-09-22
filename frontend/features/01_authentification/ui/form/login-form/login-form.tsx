"use client";

import type { LoginState } from "@/backend/features/01_authentification/schemas/login-state/login-state";
import { LoginActions } from "@/frontend/features/01_authentification/ui/actions/login-actions/login-actions";
import { AuthField } from "@/frontend/features/01_authentification/ui/field/auth-field";
import { LoginHeader } from "@/frontend/features/01_authentification/ui/header/login-header/login-header";
import { useLoginForm } from "@/lib/hooks/authentification/use-login-form/use-login-form";

type LoginFormProps = {
  state: LoginState;
  formAction: (payload: FormData) => void;
  pending: boolean;
  onRegisterClick: () => void;
};

/**
 * Présentation formulaire login — état dans useLoginForm.
 */
export function LoginForm({
  state,
  formAction,
  pending,
  onRegisterClick,
}: LoginFormProps) {
  const { isComplete, handleFormChange } = useLoginForm();

  return (
    <form
      action={formAction}
      onInput={handleFormChange}
      onChange={handleFormChange}
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

      <LoginActions
        pending={pending}
        isComplete={isComplete}
        onRegisterClick={onRegisterClick}
      />
    </form>
  );
}
