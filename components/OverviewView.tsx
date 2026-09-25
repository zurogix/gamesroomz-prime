import { ReactNode } from "react";
import { DISCOVERY_QUESTIONS, DISCOVERY_SECTIONS } from "@/lib/discovery";
import { AnswerMap, answerFor, isAnswered, sectionProgress } from "@/lib/discoveryAnswers";
import { Role } from "@/lib/permissions";
import type { DiscoveryStatus } from "@/lib/responses";
import { Stage } from "@/lib/stages";
import { AssessmentState, GameInfo } from "@/lib/types";
import GameInfoLine from "./GameInfoLine";
import PageHeader from "./PageHeader";
import NextStepCard from "./stages/NextStepCard";

type Props = {
  state: AssessmentState;
  /** The developer's own answers (used for "Continue with section …"). */
  answers: AnswerMap;
  /** The developer's own discovery status (none for product). */
  ownDiscovery?: DiscoveryStatus;
  role: Role;
  onGameInfo: (key: keyof GameInfo, value: string) => void;
  onNavigate: (view: string) => void;
  onOpenStage: (stage: Stage) => void;
  canEditTeam: boolean;
  canEditAnswers: boolean;
  /** Product: the discovery responses panel. */
  responsesSlot?: ReactNode;
};

export default function OverviewView({ state, answers, ownDiscovery, role, onGameInfo, onNavigate, onOpenStage, canEditTeam, canEditAnswers, responsesSlot }: Props) {
  const next = DISCOVERY_SECTIONS.find((s) => {
    const { done, total } = sectionProgress(answers, s.id);
    return done < total;
  });
  const nextProgress = next ? sectionProgress(answers, next.id) : null;
  const remaining = DISCOVERY_QUESTIONS.filter((q) => !isAnswered(q, answerFor(answers, q.id))).length;
  // Once started, the developer can pick up where they left off; the Next step card covers the first visit.
  const showResume = canEditAnswers && role === "developer" && remaining < DISCOVERY_QUESTIONS.length;

  return (
    <>
      <PageHeader title="Overview" crumb={`${state.gameInfo.gameName || "Untitled game"} → Gamesroomz Prime`} />
      <div className="content">
        <GameInfoLine gameInfo={state.gameInfo} onDeveloper={(developer) => onGameInfo("developer", developer)} canEdit={canEditTeam} />
        <NextStepCard role={role} status={state.status} ownDiscovery={ownDiscovery} onOpen={onOpenStage} />
        {responsesSlot}
        {showResume && next && nextProgress && (
          <div className="card resume-inline">
            <div>
              <b>Continue with {next.id} · {next.title}</b>
              <p className="hint">{nextProgress.done} of {nextProgress.total} answered · {remaining} questions left overall</p>
            </div>
            <button type="button" className="btn" onClick={() => onNavigate(next.title)}>Resume discovery →</button>
          </div>
        )}

        <section className="card">
          <h2>Plan the Prime version together</h2>
          <p className="lead">
            Developers describe how the current game is built. The product team then publishes findings and options,
            and together we agree a conversion plan with its effort and risks.
          </p>
        </section>
      </div>
    </>
  );
}
