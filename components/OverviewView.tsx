import { DISCOVERY_QUESTIONS, DISCOVERY_SECTIONS } from "@/lib/discovery";
import { answerFor, isAnswered, sectionProgress } from "@/lib/discoveryAnswers";
import { Role } from "@/lib/permissions";
import { Stage } from "@/lib/stages";
import { AssessmentState, GameInfo } from "@/lib/types";
import GameInfoLine from "./GameInfoLine";
import PageHeader from "./PageHeader";
import NextStepCard from "./stages/NextStepCard";

type Props = {
  state: AssessmentState;
  role: Role;
  onGameInfo: (key: keyof GameInfo, value: string) => void;
  onNavigate: (view: string) => void;
  onOpenStage: (stage: Stage) => void;
  canEditTeam: boolean;
  canEditAnswers: boolean;
};

export default function OverviewView({ state, role, onGameInfo, onNavigate, onOpenStage, canEditTeam, canEditAnswers }: Props) {
  const next = DISCOVERY_SECTIONS.find((s) => {
    const { done, total } = sectionProgress(state.answers, s.id);
    return done < total;
  });
  const nextProgress = next ? sectionProgress(state.answers, next.id) : null;
  const remaining = DISCOVERY_QUESTIONS.filter((q) => !isAnswered(q, answerFor(state.answers, q.id))).length;
  // Once started, the developer can pick up where they left off; the Next step card covers the first visit.
  const showResume = canEditAnswers && role === "developer" && remaining < DISCOVERY_QUESTIONS.length;

  return (
    <>
      <PageHeader title="Overview" crumb={`${state.gameInfo.gameName || "Untitled game"} → Gamesroomz Prime`} />
      <div className="content">
        <GameInfoLine gameInfo={state.gameInfo} onDeveloper={(developer) => onGameInfo("developer", developer)} canEdit={canEditTeam} />
        <NextStepCard role={role} status={state.status} onOpen={onOpenStage} />
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
