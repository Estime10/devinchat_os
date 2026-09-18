import { GlassPanel } from "@/components/ui/glass/glass-panel";
import { RegistrationForm } from "@/features/authentification/ui/form/registration-form";

export function AuthentificationScreen() {
  return (
    <main className="px-[var(--layout-margin-x)]">
      <GlassPanel>
        <div className="flex h-full w-full">
          <section
            className="h-full w-[70%]"
            aria-label="Authentification principale"
          >
            <RegistrationForm />
          </section>
          <section
            className="h-full w-[30%] border-l border-glass-border bg-fg-default/25"
            aria-label="Authentification secondaire"
          />
        </div>
      </GlassPanel>
    </main>
  );
}
