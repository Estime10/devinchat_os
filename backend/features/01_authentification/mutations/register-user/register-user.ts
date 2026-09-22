"use server";

import { registerSchema } from "@/backend/features/01_authentification/schemas/register-schema/register-schema";
import type { RegisterState } from "@/backend/features/01_authentification/schemas/register-state/register-state";
import { createClient } from "@/lib/supabase/server/server";

export async function registerUser(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    pseudo: formData.get("pseudo"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors: RegisterState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (
        key === "pseudo" ||
        key === "email" ||
        key === "password" ||
        key === "confirmPassword"
      ) {
        fieldErrors[key] = issue.message;
      }
    }

    return {
      ok: false,
      message: "Vérifie les champs du formulaire.",
      fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.pseudo,
      },
    },
  });

  if (error) {
    return {
      ok: false,
      message: "Impossible de créer le compte. Réessaie plus tard.",
      fieldErrors: {},
    };
  }

  return {
    ok: true,
    message: null,
    fieldErrors: {},
  };
}
