"use client";

import { useCallback, useEffect, useState } from "react";
import CommandPalette, { PaletteTarget } from "@/components/CommandPalette";
import DiscoverySection from "@/components/DiscoverySection";
import FindingsView from "@/components/FindingsView";
import OverviewView from "@/components/OverviewView";
import PlanDrawer from "@/components/PlanDrawer";
import PlanView from "@/components/PlanView";
import Sidebar from "@/components/Sidebar";
import PageRail from "@/components/PageRail";
import SummaryView from "@/components/SummaryView";
import LockedStage from "@/components/stages/LockedStage";
import ProgressStepper from "@/components/stages/ProgressStepper";
import StageActions from "@/components/stages/StageActions";
import { useAssessmentEditor } from "@/hooks/useAssessmentEditor";
import { useAssessmentSync } from "@/hooks/useAssessmentSync";
import { useTheme } from "@/hooks/useTheme";
import { DISCOVERY_QUESTIONS, sectionTitle } from "@/lib/discovery";
import { focusQuestion, railKindFor } from "@/lib/rail";
import { canEdit, canEditPrimeTargets, isProduct } from "@/lib/permissions";
import { ASSESSMENT_SECTIONS, FINDINGS, OVERVIEW, PLAN, SUMMARY } from "@/lib/sections";
import { currentStage, isPreview, Stage, stageById, stageForView, stageVisible } from "@/lib/stages";
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

  const { role } = user;
  const { status } = state;
  const planOpen = stageVisible(role, stageById("plan"), status);
  const viewStage = stageForView(view);
  const locked = viewStage !== null && !stageVisible(role, viewStage, status);

  const navigate = useCallback((next: string) => {
    setView(next);
    setFocusId(null);
    setDrawerId(null);
    window.scrollTo({ top: 0 });
  }, []);

  const openStage = useCallback((stage: Stage) => navigate(stage.view), [navigate]);

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
  const showRail = !locked && railKindFor(view) !== "none";

  /** Stage actions appear in the header of the stage the assessment is currently in. */
  const actionsFor = (stage: Stage) =>
    currentStage(status).id === stage.id ? <StageActions state={state} role={role} onStatus={setStatus} onToggleCheck={toggleCheck} /> : null;

  function renderView() {
    if (locked && viewStage) return <LockedStage stage={viewStage} />;
    if (ASSESSMENT_SECTIONS.includes(view)) {
      return (
        <DiscoverySection
          state={state}
          sectionTitle={view}
          focusId={focusId}
          onAnswer={updateAnswer}
          onNavigate={navigate}
          canEditAnswers={canEdit(role, status, "answers")}
          showWhatHappensNext={role === "developer" && status === "discovery-submitted"}
          stageActions={actionsFor(stageById("discovery"))}
        />
      );
    }
    if (view === FINDINGS) {
      return (
        <FindingsView
          engine={state.engineAssessment}
          isProduct={isProduct(role)}
          canEditEngine={canEdit(role, status, "engine")}
          onEngineChange={updateEngineAssessment}
          onEngineOptionChange={updateEngineOption}
          stageActions={actionsFor(stageById("findings"))}
        />
      );
    }
    if (view === PLAN) {
      return (
        <PlanView
          state={state}
          onOpen={setDrawerId}
          onNavigate={navigate}
          canEditPlan={canEdit(role, status, "plan")}
          summaryOpen={stageVisible(role, stageById("summary"), status)}
          stageActions={actionsFor(stageById("plan"))}
        />
      );
    }
    if (view === SUMMARY) {
      return (
        <SummaryView
          state={state}
          onOpenWorkstream={openWorkstream}
          stageActions={actionsFor(stageById("summary"))}
          historySlot={<VersionHistory gameId={gameId} refreshKey={`${status}:${saveStatus.savedAt ?? 0}`} />}
        />
      );
    }
    return (
      <OverviewView
        state={state}
        role={role}
        onGameInfo={updateGameInfo}
        onPrimeTargets={updatePrimeTargets}
        onNavigate={navigate}
        onOpenStage={openStage}
        canEditTargets={canEditPrimeTargets(role)}
        canEditTeam={canEdit(role, status, "developerTeam")}
        canEditAnswers={canEdit(role, status, "answers")}
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
          <ProgressStepper status={status} role={role} activeStage={viewStage} onOpen={openStage} />
          {viewStage && isPreview(role, viewStage, status) && (
            <p className="preview-note"><span className="preview-tag">Preview</span> This stage is not open to the developer yet.</p>
          )}
          {renderView()}
        </main>
        {showRail && <PageRail view={view} state={state} onJumpToQuestion={jumpToQuestion} onOpenWorkstream={openWorkstream} />}
      </div>
      {drawerId && planOpen && (
        <PlanDrawer
          plan={state.plan}
          engine={state.engineAssessment}
          openId={drawerId}
          onChange={updatePlan}
          onSelect={setDrawerId}
          onClose={closeDrawer}
          readOnly={!canEdit(role, status, "plan")}
        />
      )}
      {paletteOpen && <CommandPalette plan={state.plan} onPick={pick} onClose={() => setPaletteOpen(false)} />}
    </SaveStatusContext.Provider>
  );
}
