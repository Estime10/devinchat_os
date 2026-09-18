"use client";

import { Button } from "@/components/ui/button/button";

type LoginActionsProps = {
  pending?: boolean;
  onRegisterClick: () => void;
};

export function LoginActions({
  pending = false,
  onRegisterClick,
}: LoginActionsProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Button type="submit" disabled={pending}>
        {pending ? "[ logging in... ]" : "[ login ]"}
      </Button>
      <p className="flex items-center gap-1.5 font-sans text-xs text-fg-muted uppercase">
        <span>no account?</span>
        <button
          type="button"
          onClick={onRegisterClick}
          className="cursor-pointer text-fg-default underline-offset-4 hover:underline"
        >
          register
        </button>
      </p>
    </div>
  );
}
