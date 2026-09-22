"use client";

import type { OwnFeature } from "@/backend/features/04_features/types/own-feature/own-feature";
import {
  closeNotesPanel,
  initNotesPanel,
  killNotesPanelTimeline,
  openNotesPanel,
  switchNotesPanelContent,
} from "@/lib/animation/repository-notes-panel/notes-panel";
import { resolveWorkspaceSelectionAction } from "@/lib/hooks/repository/resolve-workspace-selection-action/resolve-workspace-selection-action";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

type NotesPanelTimeline = NonNullable<ReturnType<typeof openNotesPanel>>;

/**
 * État + orchestration panneau notes — hors composants UI.
 */
export function useRepositoryWorkspace() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [displayed, setDisplayed] = useState<OwnFeature | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const shellRef = useRef<HTMLDivElement>(null);
  const notesPanelRef = useRef<HTMLDivElement>(null);
  const notesInnerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<NotesPanelTimeline | null>(null);
  const isOpenRef = useRef(false);

  useLayoutEffect(() => {
    const notesPanel = notesPanelRef.current;
    const notesInner = notesInnerRef.current;
    if (!notesPanel || !notesInner) {
      return;
    }
    initNotesPanel({ notesPanel, notesInner });
  }, []);

  useEffect(() => {
    return () => {
      killNotesPanelTimeline(timelineRef.current);
    };
  }, []);

  const getElements = () => {
    const shell = shellRef.current;
    const notesPanel = notesPanelRef.current;
    const notesInner = notesInnerRef.current;
    if (!shell || !notesPanel || !notesInner) {
      return null;
    }
    return { shell, notesPanel, notesInner };
  };

  const open = (feature: OwnFeature) => {
    const elements = getElements();
    if (!elements) {
      return;
    }

    killNotesPanelTimeline(timelineRef.current);
    setDisplayed(feature);
    setSelectedId(feature.id);
    isOpenRef.current = true;
    setIsAnimating(true);

    timelineRef.current = openNotesPanel({
      elements,
      onComplete: () => {
        setIsAnimating(false);
      },
    });

    if (!timelineRef.current) {
      setIsAnimating(false);
    }
  };

  const close = () => {
    const elements = getElements();
    if (!elements) {
      return;
    }

    killNotesPanelTimeline(timelineRef.current);
    isOpenRef.current = false;
    setIsAnimating(true);

    timelineRef.current = closeNotesPanel({
      elements,
      onComplete: () => {
        setSelectedId(null);
        setDisplayed(null);
        setIsAnimating(false);
      },
    });

    if (!timelineRef.current) {
      setSelectedId(null);
      setDisplayed(null);
      setIsAnimating(false);
    }
  };

  const switchFeature = (feature: OwnFeature) => {
    const notesInner = notesInnerRef.current;
    setSelectedId(feature.id);

    if (!notesInner) {
      setDisplayed(feature);
      return;
    }

    killNotesPanelTimeline(timelineRef.current);
    timelineRef.current = switchNotesPanelContent({
      notesInner,
      onSwap: () => {
        setDisplayed(feature);
      },
    });

    if (!timelineRef.current) {
      setDisplayed(feature);
    }
  };

  const selectFeature = (feature: OwnFeature) => {
    const action = resolveWorkspaceSelectionAction({
      isAnimating,
      isOpen: isOpenRef.current,
      selectedId,
      nextFeatureId: feature.id,
    });

    switch (action) {
      case "ignore":
        return;
      case "close":
        close();
        return;
      case "switch":
        switchFeature(feature);
        return;
      case "open":
        open(feature);
        return;
    }
  };

  return {
    selectedId,
    displayed,
    shellRef,
    notesPanelRef,
    notesInnerRef,
    selectFeature,
  };
}
