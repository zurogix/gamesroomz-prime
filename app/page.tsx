"use client";

import { useCallback, useEffect, useState } from "react";
import CommandPalette, { PaletteTarget } from "@/components/CommandPalette";
import DiscoverySection from "@/components/DiscoverySection";
import MigrationNotice from "@/components/MigrationNotice";
import OverviewView from "@/components/OverviewView";
import PlanDrawer from "@/components/PlanDrawer";
import PlanView from "@/components/PlanView";
import Sidebar from "@/components/Sidebar";
import PageRail from "@/components/PageRail";
import SummaryView from "@/components/SummaryView";
import { useAssessment } from "@/hooks/useAssessment";
import { useTheme } from "@/hooks/useTheme";
import { DISCOVERY_QUESTIONS, sectionTitle } from "@/lib/discovery";
import { focusQuestion, railKindFor } from "@/lib/rail";
import { ASSESSMENT_SECTIONS, OVERVIEW, PLAN, SUMMARY } from "@/lib/sections";

export default function HomePage() {
  const {
    state, savedAt, migrationNotice, dismissMigrationNotice, updateGameInfo, updatePrimeTargets, updateAnswer,
    updateEngineAssessment, updateEngineOption, updatePlan, setStatus, toggleCheck, reset,
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
    const question = DISCOVERY_QUESTIONS.find((q) => q.id === id);
    if (!question) return;
    const target = sectionTitle(question.section);
    setView(target);
    setFocusId(id);
    setDrawerId(null);
    if (target === view) focusQuestion(id);
  }, [view]);

  const openWorkstream = useCallback((id: string) => {
    setView(PLAN);
    setDrawerId(id);
  }, []);

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
  const showRail = railKindFor(view) !== "none";

  function renderView() {
    if (ASSESSMENT_SECTIONS.includes(view)) {
      return (
        <DiscoverySection
          state={state}
          sectionTitle={view}
          savedAt={savedAt}
          focusId={focusId}
          onAnswer={updateAnswer}
          onNavigate={navigate}
        />
      );
    }
    if (view === PLAN) {
      return (
        <PlanView
          state={state}
          savedAt={savedAt}
          onOpen={setDrawerId}
          onEngineChange={updateEngineAssessment}
          onEngineOptionChange={updateEngineOption}
          onNavigate={navigate}
        />
      );
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
    return (
      <OverviewView state={state} savedAt={savedAt} onGameInfo={updateGameInfo} onPrimeTargets={updatePrimeTargets} onNavigate={navigate} />
    );
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
        <main className="main">
          {migrationNotice && <MigrationNotice onDismiss={dismissMigrationNotice} />}
          {renderView()}
        </main>
        <PageRail view={view} state={state} onJumpToQuestion={jumpToQuestion} onOpenWorkstream={openWorkstream} />
      </div>
      {drawerId && (
        <PlanDrawer plan={state.plan} engine={state.engineAssessment} openId={drawerId} onChange={updatePlan} onSelect={setDrawerId} onClose={closeDrawer} />
      )}
      {paletteOpen && <CommandPalette plan={state.plan} onPick={pick} onClose={() => setPaletteOpen(false)} />}
    </>
  );
}
