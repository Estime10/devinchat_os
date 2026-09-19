import { registerSchema } from "@/backend/authentification/schemas/register-schema";

/**
 * True si le FormData register passe le schema Zod (aligné serveur).
 */
export function isRegisterFormComplete(formData: FormData): boolean {
  return registerSchema.safeParse({
    pseudo: formData.get("pseudo"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  }).success;
}
