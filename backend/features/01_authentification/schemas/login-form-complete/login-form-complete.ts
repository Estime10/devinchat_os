import { loginSchema } from "@/backend/features/01_authentification/schemas/login-schema/login-schema";

/**
 * True si le FormData login passe le schema Zod (aligné serveur).
 */
export function isLoginFormComplete(formData: FormData): boolean {
  return loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  }).success;
}
