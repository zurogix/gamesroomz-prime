"use client";

import { useCallback, useEffect, useState } from "react";
import AssessmentSection from "@/components/AssessmentSection";
import CommandPalette, { PaletteTarget } from "@/components/CommandPalette";
import OverviewView from "@/components/OverviewView";
import PlanDrawer from "@/components/PlanDrawer";
import PlanView from "@/components/PlanView";
import Sidebar from "@/components/Sidebar";
import SummaryRail from "@/components/SummaryRail";
import SummaryView from "@/components/SummaryView";
import { useAssessment } from "@/hooks/useAssessment";
import { useTheme } from "@/hooks/useTheme";
import { questions } from "@/lib/questions";
import { ASSESSMENT_SECTIONS, OVERVIEW, PLAN, SUMMARY } from "@/lib/sections";

export default function HomePage() {
  const {
    state, savedAt, updateGameInfo, updateResponse, updateEngineAssessment, updateEngineOption, updatePlan, setStatus, toggleCheck, syncPlan, reset,
  } = useAssessment();
  const { theme, setTheme } = useTheme();
  const [view, setView] = useState(OVERVIEW);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const navigate = useCallback((next: string) => {
    setView(next);
    setFocusId(null);
    setDrawerId(null);
    window.scrollTo({ top: 0 });
  }, []);

  const jumpToQuestion = useCallback((id: string) => {
    const question = questions.find((q) => q.id === id);
    if (!question) return;
    setView(question.section);
    setFocusId(id);
    setDrawerId(null);
  }, []);

  const openWorkstream = useCallback((id: string) => {
    setView(PLAN);
    setDrawerId(id);
  }, []);

  const continueToPlan = useCallback(() => {
    syncPlan();
    navigate(PLAN);
  }, [syncPlan, navigate]);

  const resetAll = useCallback(() => {
    if (!window.confirm("Reset this assessment and remove the locally saved draft?")) return;
    reset();
    navigate(OVERVIEW);
  }, [reset, navigate]);

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

  const closeDrawer = useCallback(() => setDrawerId(null), []);
  const showRail = view !== SUMMARY;

  function renderView() {
    if (ASSESSMENT_SECTIONS.includes(view)) {
      return (
        <AssessmentSection
          state={state}
          section={view}
          savedAt={savedAt}
          focusId={focusId}
          onChange={updateResponse}
          onEngineChange={updateEngineAssessment}
          onEngineOptionChange={updateEngineOption}
          onNavigate={navigate}
          onContinueToPlan={continueToPlan}
        />
      );
    }
    if (view === PLAN) {
      return <PlanView state={state} savedAt={savedAt} onOpen={setDrawerId} onSync={syncPlan} onNavigate={navigate} />;
    }
    if (view === SUMMARY) {
      return (
        <SummaryView
          state={state}
          savedAt={savedAt}
          onOpenWorkstream={openWorkstream}
          onStatus={setStatus}
          onToggleCheck={toggleCheck}
        />
      );
    }
    return <OverviewView state={state} savedAt={savedAt} onGameInfo={updateGameInfo} onNavigate={navigate} />;
  }

  return (
    <>
      <div className={`shell ${showRail ? "" : "no-rail"}`}>
        <Sidebar
          state={state}
          active={view}
          theme={theme}
          onNavigate={navigate}
          onOpenPalette={() => setPaletteOpen(true)}
          onTheme={setTheme}
          onReset={resetAll}
        />
        <main className="main">{renderView()}</main>
        {showRail && <SummaryRail state={state} onJumpToQuestion={jumpToQuestion} onOpenWorkstream={openWorkstream} />}
      </div>
      {drawerId && (
        <PlanDrawer plan={state.plan} openId={drawerId} onChange={updatePlan} onSelect={setDrawerId} onClose={closeDrawer} />
      )}
      {paletteOpen && <CommandPalette plan={state.plan} onPick={pick} onClose={() => setPaletteOpen(false)} />}
    </>
  );
}
