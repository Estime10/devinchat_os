import { RegistrationActions } from "@/features/authentification/ui/actions/registration-actions";
import { AuthField } from "@/features/authentification/ui/field/auth-field";
import { RegistrationHeader } from "@/features/authentification/ui/header/registration-header";

/**
 * Orchestrateur UI du formulaire d’inscription — pas de logique métier.
 */
export function RegistrationForm() {
  return (
    <form className="flex h-full w-full flex-col justify-center gap-8 px-6 py-10 sm:px-10 md:px-14">
      <RegistrationHeader />

      <div className="flex flex-col gap-5">
        <AuthField
          label="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="root@devinchat.os"
        />
        <AuthField
          label="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
        />
        <AuthField
          label="confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
        />
      </div>

      <RegistrationActions />
    </form>
  );
}
