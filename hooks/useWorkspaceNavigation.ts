"use client";

import { useCallback, useEffect, useState } from "react";
import type { PaletteTarget } from "@/components/CommandPalette";
import { DISCOVERY_QUESTIONS, sectionTitle } from "@/lib/discovery";
import { focusQuestion } from "@/lib/rail";
import { OVERVIEW, PLAN } from "@/lib/sections";
import { Stage, stageForView } from "@/lib/stages";

/**
 * Which page of the workspace is shown, plus the focused question, the open workstream drawer and the
 * command palette. Views that are not open (isOpen) are never shown; the Overview is used instead.
 */
export function useWorkspaceNavigation(isOpen: (view: string) => boolean) {
  const [view, setView] = useState(OVERVIEW);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  // A one-off screen (e.g. the thank-you page after submitting) shown until the user navigates anywhere.
  const [transient, setTransient] = useState<string | null>(null);

  // A stage that is not open is never shown, even if it was the last view (e.g. after a stage was reopened).
  const shownView = transient ?? (isOpen(view) ? view : OVERVIEW);
  const planOpen = isOpen(PLAN);

  const navigate = useCallback((next: string) => {
    if (!isOpen(next)) return;
    setTransient(null);
    setView(next);
    setFocusId(null);
    setDrawerId(null);
    window.scrollTo({ top: 0 });
  }, [isOpen]);

  const openStage = useCallback((stage: Stage) => navigate(stage.view), [navigate]);

  const jumpToQuestion = useCallback((id: string) => {
    const question = DISCOVERY_QUESTIONS.find((q) => q.id === id);
    if (!question) return;
    const target = sectionTitle(question.section);
    setTransient(null);
    setView(target);
    setFocusId(id);
    setDrawerId(null);
    if (target === view && !transient) focusQuestion(id);
  }, [view, transient]);

  const openWorkstream = useCallback((id: string) => {
    if (!planOpen) return;
    setTransient(null);
    setView(PLAN);
    setDrawerId(id);
  }, [planOpen]);

  const pick = useCallback((target: PaletteTarget) => {
    setPaletteOpen(false);
    if (target.view) return navigate(target.view);
    if (target.questionId) return jumpToQuestion(target.questionId);
    if (target.workstreamId) openWorkstream(target.workstreamId);
  }, [navigate, jumpToQuestion, openWorkstream]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const showTransient = useCallback((screen: string) => {
    setTransient(screen);
    setFocusId(null);
    setDrawerId(null);
    window.scrollTo({ top: 0 });
  }, []);

  return {
    shownView,
    showTransient,
    viewStage: stageForView(shownView),
    planOpen,
    focusId,
    drawerId,
    setDrawerId,
    closeDrawer: useCallback(() => setDrawerId(null), []),
    paletteOpen,
    setPaletteOpen,
    navigate,
    openStage,
    jumpToQuestion,
    openWorkstream,
    pick,
  };
}
