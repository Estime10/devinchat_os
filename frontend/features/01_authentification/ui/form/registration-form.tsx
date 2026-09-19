"use client";

import { isRegisterFormComplete } from "@/backend/features/01_authentification/schemas/register-form-complete";
import type { RegisterState } from "@/backend/features/01_authentification/schemas/register-state";
import { RegistrationActions } from "@/frontend/features/01_authentification/ui/actions/registration-actions";
import { AuthField } from "@/frontend/features/01_authentification/ui/field/auth-field";
import { RegistrationHeader } from "@/frontend/features/01_authentification/ui/header/registration-header";
import { useState, type FormEvent } from "react";

type RegistrationFormProps = {
  state: RegisterState;
  formAction: (payload: FormData) => void;
  pending: boolean;
  onLoginClick: () => void;
};

/**
 * Orchestrateur UI du formulaire d’inscription.
 */
export function RegistrationForm({
  state,
  formAction,
  pending,
  onLoginClick,
}: RegistrationFormProps) {
  const [isComplete, setIsComplete] = useState(false);

  const handleFormChange = (event: FormEvent<HTMLFormElement>) => {
    setIsComplete(isRegisterFormComplete(new FormData(event.currentTarget)));
  };

  return (
    <form
      action={formAction}
      onInput={handleFormChange}
      onChange={handleFormChange}
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

      <RegistrationActions
        pending={pending}
        isComplete={isComplete}
        onLoginClick={onLoginClick}
      />
    </form>
  );
}
