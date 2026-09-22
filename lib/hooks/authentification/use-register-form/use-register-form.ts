"use client";

import { isRegisterFormComplete } from "@/backend/features/01_authentification/schemas/register-form-complete/register-form-complete";
import { useState, type FormEvent } from "react";

/**
 * Complétude formulaire register — hors UI.
 */
export function useRegisterForm() {
  const [isComplete, setIsComplete] = useState(false);

  const handleFormChange = (event: FormEvent<HTMLFormElement>) => {
    setIsComplete(isRegisterFormComplete(new FormData(event.currentTarget)));
  };

  return { isComplete, handleFormChange };
}
