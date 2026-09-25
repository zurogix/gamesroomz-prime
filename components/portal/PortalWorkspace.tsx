"use client";

import { useCallback, useEffect, useState } from "react";
import CommandPalette, { PaletteTarget } from "@/components/CommandPalette";
import DiscoverySection from "@/components/DiscoverySection";
import OverviewView from "@/components/OverviewView";
import PlanDrawer from "@/components/PlanDrawer";
import PlanView from "@/components/PlanView";
import Sidebar from "@/components/Sidebar";
import PageRail from "@/components/PageRail";
import SummaryView from "@/components/SummaryView";
import { useAssessmentEditor } from "@/hooks/useAssessmentEditor";
import { useAssessmentSync } from "@/hooks/useAssessmentSync";
import { useTheme } from "@/hooks/useTheme";
import { DISCOVERY_QUESTIONS, sectionTitle } from "@/lib/discovery";
import { focusQuestion, railKindFor } from "@/lib/rail";
import { allowedStatuses, canEditPrimeTargets } from "@/lib/permissions";
import { ASSESSMENT_SECTIONS, OVERVIEW, PLAN, SUMMARY } from "@/lib/sections";
import { AssessmentState } from "@/lib/types";
import { SaveStatusContext } from "@/components/SaveStatusContext";
import { CurrentUser } from "@/components/UserBadge";
import ConflictBanner from "./ConflictBanner";
import VersionHistory from "./VersionHistory";

type Props = {
  gameId: string;
  initialState: AssessmentState;
  initialVersion: number;
  user: CurrentUser;
  /** Loads the latest saved version after a conflict; resolves to an error message or null. */
  onReload: () => Promise<string | null>;
};

/** The assessment workspace for one game: edits in memory, saves through the API. */
export default function PortalWorkspace({ gameId, initialState, initialVersion, user, onReload }: Props) {
  const {
    state, updateGameInfo, updatePrimeTargets, updateAnswer,
    updateEngineAssessment, updateEngineOption, updatePlan, setStatus, toggleCheck,
  } = useAssessmentEditor(initialState);
  const saveStatus = useAssessmentSync(gameId, state, initialVersion);
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
          onOpenWorkstream={openWorkstream}
          onStatus={setStatus}
          onToggleCheck={toggleCheck}
          allowedStatuses={allowedStatuses(user.role)}
          historySlot={<VersionHistory gameId={gameId} refreshKey={`${state.status}:${saveStatus.savedAt ?? 0}`} />}
        />
      );
    }
    return (
      <OverviewView
        state={state}
        onGameInfo={updateGameInfo}
        onPrimeTargets={updatePrimeTargets}
        onNavigate={navigate}
        canEditTargets={canEditPrimeTargets(user.role)}
      />
    );
  }

  return (
    <SaveStatusContext.Provider value={saveStatus}>
      <div className={`shell ${showRail ? "" : "no-rail"}`}>
        <Sidebar
          state={state}
          active={view}
          theme={theme}
          onNavigate={navigate}
          onOpenPalette={() => setPaletteOpen(true)}
          onTheme={setTheme}
          user={user}
        />
        <main className="main">
          {saveStatus.state === "conflict" && <ConflictBanner onReload={onReload} />}
          {renderView()}
        </main>
        <PageRail view={view} state={state} onJumpToQuestion={jumpToQuestion} onOpenWorkstream={openWorkstream} />
      </div>
      {drawerId && (
        <PlanDrawer plan={state.plan} engine={state.engineAssessment} openId={drawerId} onChange={updatePlan} onSelect={setDrawerId} onClose={closeDrawer} />
      )}
      {paletteOpen && <CommandPalette plan={state.plan} onPick={pick} onClose={() => setPaletteOpen(false)} />}
    </SaveStatusContext.Provider>
  );
}
