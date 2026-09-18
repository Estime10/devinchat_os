import { Button } from "@/components/ui/button/button";

export function RegistrationActions() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Button>[ register ]</Button>
      <p className="flex items-center gap-1.5 font-sans text-xs text-fg-muted">
        <span>already registered?</span>
        <span className="cursor-pointer text-fg-default uppercase underline-offset-4 hover:underline">
          login
        </span>
      </p>
    </div>
  );
}
