"use client";

import type { RegisterState } from "@/backend/authentification/schemas/register-state";
import { RegistrationActions } from "@/features/authentification/ui/actions/registration-actions";
import { AuthField } from "@/features/authentification/ui/field/auth-field";
import { RegistrationHeader } from "@/features/authentification/ui/header/registration-header";

type RegistrationFormProps = {
  state: RegisterState;
  formAction: (payload: FormData) => void;
  pending: boolean;
};

/**
 * Orchestrateur UI du formulaire d’inscription.
 */
export function RegistrationForm({
  state,
  formAction,
  pending,
}: RegistrationFormProps) {
  return (
    <form
      action={formAction}
      className="flex h-full w-full flex-col justify-center gap-8 px-6 py-10 sm:px-10 md:px-14"
    >
      <RegistrationHeader />

      <div className="flex flex-col gap-5">
        <AuthField
          label="pseudo"
          name="pseudo"
          type="text"
          autoComplete="username"
          placeholder="root"
          error={state.fieldErrors.pseudo}
        />
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
          autoComplete="new-password"
          placeholder="••••••••"
          error={state.fieldErrors.password}
        />
        <AuthField
          label="confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={state.fieldErrors.confirmPassword}
        />
      </div>

      {!state.ok && state.message ? (
        <p className="font-sans text-sm text-danger-fg" role="status">
          {state.message}
        </p>
      ) : null}

      <RegistrationActions pending={pending} />
    </form>
  );
}
