import { loginSchema } from "@/backend/authentification/schemas/login-schema";

/**
 * True si le FormData login passe le schema Zod (aligné serveur).
 */
export function isLoginFormComplete(formData: FormData): boolean {
  return loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  }).success;
}
