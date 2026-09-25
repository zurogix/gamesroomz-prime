import { planCoverage, totalPlanDays } from "@/lib/assessment";
import { DISCOVERY_QUESTIONS, DISCOVERY_SECTIONS } from "@/lib/discovery";
import { answerFor, discoveryCoverage, isAnswered, sectionProgress } from "@/lib/discoveryAnswers";
import { AssessmentState, GameInfo, PrimeTargets } from "@/lib/types";
import GameInfoLine from "./GameInfoLine";
import PageHeader from "./PageHeader";
import PrimeTargetsCard from "./PrimeTargetsCard";
import PrimeTargetsSummary from "./PrimeTargetsSummary";

type Props = {
  state: AssessmentState;
  onGameInfo: (key: keyof GameInfo, value: string) => void;
  onPrimeTargets: (patch: Partial<PrimeTargets>) => void;
  onNavigate: (view: string) => void;
  canEditTargets: boolean;
};

const STEPS = [
  { title: "Discover", text: "How is the game built today?" },
  { title: "Classify", text: "Reuse, extend, refactor, rewrite, new or remove?" },
  { title: "Plan", text: "How will Prime support be built?" },
  { title: "Estimate", text: "Person-days and risks" },
];

export default function OverviewView({ state, onGameInfo, onPrimeTargets, onNavigate, canEditTargets }: Props) {
  const next = DISCOVERY_SECTIONS.find((s) => {
    const { done, total } = sectionProgress(state.answers, s.id);
    return done < total;
  });
  const nextProgress = next ? sectionProgress(state.answers, next.id) : null;
  const remaining = DISCOVERY_QUESTIONS.filter((q) => !isAnswered(q, answerFor(state.answers, q.id))).length;
  const stepDone = [
    discoveryCoverage(state.answers) === 100,
    state.plan.every((w) => w.classification),
    planCoverage(state) === 100,
    totalPlanDays(state) > 0 && state.plan.every((w) => w.personDays > 0),
  ];

  return (
    <>
      <PageHeader title="Overview" crumb={`${state.gameInfo.gameName || "Untitled game"} → Gamesroomz Prime`} />
      <div className="content">
        <GameInfoLine gameInfo={state.gameInfo} onDeveloper={(developer) => onGameInfo("developer", developer)} canEdit />
        {next && nextProgress && (
          <div className="resume">
            <div>
              <b>Continue with {next.id} · {next.title}</b>
              <p>{nextProgress.done} of {nextProgress.total} answered · {remaining} questions left overall</p>
            </div>
            <button type="button" className="btn" onClick={() => onNavigate(next.title)}>Resume discovery →</button>
          </div>
        )}

        <section className="card">
          <h2>Plan the Prime version together</h2>
          <p className="lead">
            Developers describe how the current game is built; the product team records the Prime targets. Together we
            classify each workstream, compare the options, and agree on a plan with its effort and risks.
          </p>
          <ol className="steps">
            {STEPS.map((step, i) => (
              <li key={step.title} className={stepDone[i] ? "done" : ""}>
                <b>{step.title}</b>
                {step.text}
              </li>
            ))}
          </ol>
        </section>

        {canEditTargets ? (
          <PrimeTargetsCard targets={state.primeTargets} onChange={onPrimeTargets} />
        ) : (
          <PrimeTargetsSummary targets={state.primeTargets} />
        )}
      </div>
    </>
  );
}
