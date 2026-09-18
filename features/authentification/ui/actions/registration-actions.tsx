"use client";

import { Button } from "@/components/ui/button/button";

type RegistrationActionsProps = {
  pending?: boolean;
  onLoginClick: () => void;
};

export function RegistrationActions({
  pending = false,
  onLoginClick,
}: RegistrationActionsProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Button type="submit" disabled={pending}>
        {pending ? "[ registering... ]" : "[ register ]"}
      </Button>
      <p className="flex items-center gap-1.5 font-sans text-xs text-fg-muted uppercase">
        <span>already registered?</span>
        <button
          type="button"
          onClick={onLoginClick}
          className="cursor-pointer uppercase text-fg-default underline-offset-4 hover:underline"
        >
          login
        </button>
      </p>
    </div>
  );
}
