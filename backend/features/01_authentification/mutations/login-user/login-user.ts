"use server";

import { loginSchema } from "@/backend/features/01_authentification/schemas/login-schema/login-schema";
import type { LoginState } from "@/backend/features/01_authentification/schemas/login-state/login-state";
import { createClient } from "@/lib/supabase/server/server";

export async function loginUser(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: LoginState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "email" || key === "password") {
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
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      ok: false,
      message: "Identifiants incorrects.",
      fieldErrors: {},
    };
  }

  return {
    ok: true,
    message: null,
    fieldErrors: {},
  };
}
