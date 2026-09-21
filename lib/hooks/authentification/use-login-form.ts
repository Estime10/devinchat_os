"use client";

import { isLoginFormComplete } from "@/backend/features/01_authentification/schemas/login-form-complete";
import { useState, type FormEvent } from "react";

/**
 * Complétude formulaire login — hors UI.
 */
export function useLoginForm() {
  const [isComplete, setIsComplete] = useState(false);

  const handleFormChange = (event: FormEvent<HTMLFormElement>) => {
    setIsComplete(isLoginFormComplete(new FormData(event.currentTarget)));
  };

  return { isComplete, handleFormChange };
}
