import type { OwnFeature } from "@/backend/features/04_features/types/own-feature";
import { StateEmpty } from "@/frontend/components/states/empty/state-empty";

type RepositoryNotesSectionProps = {
  feature: OwnFeature;
};

/**
 * Notes de la branche sélectionnée — shell V1 (pas de persistance).
 */
export function RepositoryNotesSection({
  feature,
}: RepositoryNotesSectionProps) {
  const branchLabel =
    feature.branchName && feature.branchName.length > 0
      ? feature.branchName
      : "branch deleted";

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <p className="mb-4 shrink-0 font-sans text-xs tracking-[0.2em] text-white uppercase">
        {"// notes"}
      </p>
      <div className="mb-4 shrink-0 space-y-1 border-b border-glass-border pb-4">
        <p className="truncate font-sans text-base leading-snug text-white">
          {feature.name}
        </p>
        <p className="truncate font-sans text-sm leading-snug text-white/50 uppercase">
          {branchLabel}
        </p>
        <p className="font-sans text-xs tracking-wide text-fg-default uppercase">
          {feature.status.replaceAll("_", " ")}
        </p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        <StateEmpty>No notes yet for this branch.</StateEmpty>
      </div>
    </section>
  );
}
