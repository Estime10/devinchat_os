"use client";

import { Button } from "@/frontend/components/ui/button/button";

type RegistrationActionsProps = {
  pending?: boolean;
  isComplete?: boolean;
  onLoginClick: () => void;
};

export function RegistrationActions({
  pending = false,
  isComplete = false,
  onLoginClick,
}: RegistrationActionsProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Button type="submit" disabled={pending || !isComplete}>
        {pending ? "[ registering... ]" : "[ register ]"}
      </Button>
      <p className="flex items-center gap-1.5 font-sans text-xs text-white uppercase">
        <span>already registered?</span>
        <button
          type="button"
          onClick={onLoginClick}
          className="cursor-pointer text-white uppercase underline-offset-4 hover:underline"
        >
          login
        </button>
      </p>
    </div>
  );
}
