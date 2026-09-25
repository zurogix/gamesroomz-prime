"use client";

import { useCallback, useState } from "react";
import CommandPalette from "@/components/CommandPalette";
import DiscoverySection from "@/components/DiscoverySection";
import FindingsView from "@/components/FindingsView";
import OverviewView from "@/components/OverviewView";
import PlanDrawer from "@/components/PlanDrawer";
import PlanView from "@/components/PlanView";
import Sidebar from "@/components/Sidebar";
import PageRail from "@/components/PageRail";
import SummaryView from "@/components/SummaryView";
import CompareView from "@/components/discovery/CompareView";
import DeveloperPicker from "@/components/discovery/DeveloperPicker";
import ResponsesPanel from "@/components/discovery/ResponsesPanel";
import SubmittedView from "@/components/discovery/SubmittedView";
import ProgressLine from "@/components/stages/ProgressLine";
import StageActions from "@/components/stages/StageActions";
import SubmitDiscoveryButton from "@/components/stages/SubmitDiscoveryButton";
import { useAssessmentEditor } from "@/hooks/useAssessmentEditor";
import { DiscoveryData, useDiscovery } from "@/hooks/useDiscovery";
import { useTheme } from "@/hooks/useTheme";
import { BACKUP_PREFIX, useVersionedAutosave } from "@/hooks/useVersionedAutosave";
import { useWorkspaceNavigation } from "@/hooks/useWorkspaceNavigation";
import { apiRequest } from "@/lib/apiClient";
import { unansweredQuestions } from "@/lib/discoveryAnswers";
import { railKindFor } from "@/lib/rail";
import { canEdit, isProduct } from "@/lib/permissions";
import { discoveryKpi, publishFindingsNote, viewAnswersTarget } from "@/lib/responses";
import { combineSaveStatus } from "@/lib/saveStatus";
import { ASSESSMENT_SECTIONS, COMPARE, FINDINGS, OVERVIEW, PLAN, SUBMITTED, SUMMARY } from "@/lib/sections";
import { currentStage, navigableStages, Stage, stageById, viewOpen } from "@/lib/stages";
import { AssessmentState } from "@/lib/types";
import { SaveStatusContext } from "@/components/SaveStatusContext";
import { CurrentUser } from "@/components/UserBadge";
import ConflictBanner from "./ConflictBanner";
import VersionHistory from "./VersionHistory";

type Props = {
  gameId: string;
  initialState: AssessmentState;
  initialVersion: number;
  initialDiscovery: DiscoveryData;
  user: CurrentUser;
  /** Loads the latest saved version after a conflict; resolves to an error message or null. */
  onReload: () => Promise<string | null>;
};

/** The assessment workspace for one game: edits in memory, saves through the API. */
export default function PortalWorkspace({ gameId, initialState, initialVersion, initialDiscovery, user, onReload }: Props) {
  const { state, updateGameInfo, updateEngineAssessment, updateEngineOption, updatePlan, setStatus, toggleCheck } = useAssessmentEditor(initialState);
  const sendAssessment = useCallback(
    (data: AssessmentState, version: number) =>
      apiRequest<{ version: number }>(`/api/games/${gameId}/assessment`, { method: "PUT", body: JSON.stringify({ state: data, version }) }),
    [gameId],
  );
  const assessmentSave = useVersionedAutosave(`${BACKUP_PREFIX}${gameId}`, state, initialVersion, sendAssessment);
  const { role } = user;
  const { status } = state;
  const discovery = useDiscovery(gameId, role, status, initialDiscovery);
  const saveStatus = combineSaveStatus(assessmentSave, discovery.autosave);
  const { theme, setTheme } = useTheme();
  // "Needs an answer" marks appear only after the developer has tried to submit once.
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const stages = navigableStages(status);
  // "Compare answers" is for the product team only.
  const isOpen = useCallback((v: string) => viewOpen(v, status) && (v !== COMPARE || isProduct(role)), [status, role]);
  const nav = useWorkspaceNavigation(isOpen);
  const { shownView, viewStage } = nav;
  const openViews = [OVERVIEW, ...ASSESSMENT_SECTIONS, COMPARE, FINDINGS, PLAN, SUMMARY].filter(isOpen);
  const showRail = railKindFor(shownView) !== "none";
  const answers = discovery.shownAnswers;
  const ownStatus = discovery.own?.status;

  /** Game status actions appear in the header of the stage the assessment is currently in. */
  const actionsFor = (stage: Stage) =>
    currentStage(status).id === stage.id ? (
      <StageActions state={state} role={role} onStatus={setStatus} onToggleCheck={toggleCheck} publishNote={publishFindingsNote(discovery.responses)} />
    ) : null;

  /** Product: open section A with this developer's answers selected. */
  const viewAnswers = (responseId: string) => {
    const target = viewAnswersTarget(responseId);
    discovery.setViewingId(target.viewingId);
    nav.navigate(target.view);
  };

  /** On success the developer sees the thank-you screen instead of the section they were on. */
  const submitAndThank = async (): Promise<string | null> => {
    const failure = await discovery.submitOwn();
    if (!failure) nav.showTransient(SUBMITTED);
    return failure;
  };

  const submitAction = discovery.canEditOwn ? (
    <SubmitDiscoveryButton
      unanswered={unansweredQuestions(answers)}
      onSubmit={submitAndThank}
      onJumpToQuestion={nav.jumpToQuestion}
      onBlocked={() => setSubmitAttempted(true)}
    />
  ) : null;

  const productOnly = <T,>(node: T) => (isProduct(role) ? node : undefined);

  function renderView() {
    if (shownView === SUBMITTED) {
      return (
        <SubmittedView
          submittedAt={discovery.own?.submittedAt ?? null}
          onOverview={() => nav.navigate(OVERVIEW)}
          onViewAnswers={() => nav.navigate(ASSESSMENT_SECTIONS[0])}
        />
      );
    }
    if (shownView === COMPARE) return <CompareView responses={discovery.responses} />;
    if (ASSESSMENT_SECTIONS.includes(shownView)) {
      return (
        <DiscoverySection
          state={state}
          answers={answers}
          sectionTitle={shownView}
          focusId={nav.focusId}
          onAnswer={discovery.updateAnswer}
          onNavigate={nav.navigate}
          canEditAnswers={discovery.canEditOwn}
          showWhatHappensNext={role === "developer" && ownStatus === "submitted" && status === "discovery"}
          markUnanswered={submitAttempted && discovery.canEditOwn}
          showProductNote={isProduct(role) && status === "discovery"}
          stageActions={actionsFor(stageById("discovery"))}
          submitAction={submitAction}
          exportResponses={discovery.exportResponses}
          viewerSlot={productOnly(<DeveloperPicker responses={discovery.responses} viewingId={discovery.viewing?.id ?? null} onChange={discovery.setViewingId} />)}
        />
      );
    }
    if (shownView === FINDINGS) {
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
    if (shownView === PLAN) {
      return (
        <PlanView
          state={state}
          onOpen={nav.setDrawerId}
          onNavigate={nav.navigate}
          canEditPlan={canEdit(role, status, "plan")}
          summaryOpen={isOpen(SUMMARY)}
          stageActions={actionsFor(stageById("plan"))}
        />
      );
    }
    if (shownView === SUMMARY) {
      return (
        <SummaryView
          state={state}
          onOpenWorkstream={nav.openWorkstream}
          discoveryKpi={discoveryKpi(role, discovery.own, discovery.responses)}
          exportResponses={discovery.exportResponses}
          stageActions={actionsFor(stageById("summary"))}
          historySlot={<VersionHistory gameId={gameId} refreshKey={`${status}:${saveStatus.savedAt ?? 0}`} />}
        />
      );
    }
    return (
      <OverviewView
        state={state}
        answers={answers}
        ownDiscovery={ownStatus}
        role={role}
        onGameInfo={updateGameInfo}
        onNavigate={nav.navigate}
        onOpenStage={nav.openStage}
        canEditTeam={canEdit(role, status, "developerTeam")}
        canEditAnswers={discovery.canEditOwn}
        responsesSlot={productOnly(
          <ResponsesPanel gameId={gameId} state={state} responses={discovery.responses} onView={viewAnswers} onChanged={discovery.refreshResponses} />,
        )}
      />
    );
  }

  return (
    <SaveStatusContext.Provider value={saveStatus}>
      <div className={`shell ${showRail ? "" : "no-rail"}`}>
        <Sidebar
          state={state}
          answers={answers}
          active={shownView}
          theme={theme}
          onNavigate={nav.navigate}
          onOpenPalette={() => nav.setPaletteOpen(true)}
          onTheme={setTheme}
          user={user}
          stages={stages}
          showCompare={isOpen(COMPARE)}
        />
        <main className="main">
          {saveStatus.state === "conflict" && <ConflictBanner onReload={onReload} />}
          <ProgressLine stages={stages} status={status} activeStage={viewStage} onOpen={nav.openStage} />
          {renderView()}
        </main>
        {showRail && <PageRail view={shownView} state={state} answers={answers} ownDiscovery={ownStatus} productNote={discovery.productNote} onJumpToQuestion={nav.jumpToQuestion} onOpenWorkstream={nav.openWorkstream} />}
      </div>
      {nav.drawerId && nav.planOpen && (
        <PlanDrawer
          plan={state.plan}
          engine={state.engineAssessment}
          openId={nav.drawerId}
          onChange={updatePlan}
          onSelect={nav.setDrawerId}
          onClose={nav.closeDrawer}
          readOnly={!canEdit(role, status, "plan")}
        />
      )}
      {nav.paletteOpen && <CommandPalette views={openViews} plan={state.plan} onPick={nav.pick} onClose={() => nav.setPaletteOpen(false)} />}
    </SaveStatusContext.Provider>
  );
}
