"use client";

import type { OwnFeature } from "@/backend/features/04_features/types/own-feature";
import { useRepositoryWorkspace } from "@/lib/hooks/repository/use-repository-workspace";
import { RepositoryFeatureSection } from "@/frontend/features/03_repository/ui/section/repository-feature-section";
import { RepositoryNotesSection } from "@/frontend/features/03_repository/ui/section/repository-notes-section";

type RepositoryWorkspaceProps = {
  features: OwnFeature[] | null;
};

/**
 * Présentation workspace — état dans useRepositoryWorkspace.
 */
export function RepositoryWorkspace({ features }: RepositoryWorkspaceProps) {
  const {
    selectedId,
    displayed,
    shellRef,
    notesPanelRef,
    notesInnerRef,
    selectFeature,
  } = useRepositoryWorkspace();

  return (
    <div
      ref={shellRef}
      className="flex min-h-0 flex-1 overflow-hidden"
      style={{ columnGap: 0, gap: 0 }}
    >
      <div className="flex min-h-0 min-w-0 flex-1 justify-center overflow-hidden">
        <div className="flex min-h-0 w-full max-w-5xl flex-col overflow-hidden">
          <RepositoryFeatureSection
            features={features}
            selectedFeatureId={selectedId}
            onSelectFeature={selectFeature}
          />
        </div>
      </div>

      <div
        ref={notesPanelRef}
        className="min-h-0 shrink-0 overflow-hidden"
        style={{ width: 0 }}
        aria-hidden={selectedId === null}
      >
        <div
          ref={notesInnerRef}
          className="flex h-full min-h-0 flex-col overflow-hidden pl-14"
        >
          {displayed ? <RepositoryNotesSection feature={displayed} /> : null}
        </div>
      </div>
    </div>
  );
}
