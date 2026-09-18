import { z } from "zod";

export const registerSchema = z
  .object({
    pseudo: z
      .string()
      .trim()
      .min(2, "Le pseudo doit contenir au moins 2 caractères")
      .max(32, "Le pseudo ne peut pas dépasser 32 caractères"),
    email: z.string().trim().email("Email invalide"),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string().min(1, "Confirmation requise"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
