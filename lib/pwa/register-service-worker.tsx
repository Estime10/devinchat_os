"use client";

import { useEffect } from "react";

/**
 * Enregistre le SW minimal (`/sw.js`) — critère d’install PWA.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // SW optionnel en local / preview — ne bloque pas l’UI
    });
  }, []);

  return null;
}
