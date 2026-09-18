"use client";

import { Button } from "@/components/ui/button/button";

type RegistrationActionsProps = {
  pending?: boolean;
};

export function RegistrationActions({
  pending = false,
}: RegistrationActionsProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Button type="submit" disabled={pending}>
        {pending ? "[ registering... ]" : "[ register ]"}
      </Button>
      <p className="flex items-center gap-1.5 font-sans text-xs text-fg-muted uppercase">
        <span>already registered?</span>
        <span className="cursor-pointer text-fg-default underline-offset-4 hover:underline">
          login
        </span>
      </p>
    </div>
  );
}
