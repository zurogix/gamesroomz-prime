import { assessmentCoverage, isQuestionDone, planCoverage, totalPlanDays } from "@/lib/assessment";
import { questions } from "@/lib/questions";
import { ASSESSMENT_SECTIONS } from "@/lib/sections";
import { AssessmentState, GameInfo, Question } from "@/lib/types";
import PageHeader from "./PageHeader";

type Props = {
  state: AssessmentState;
  savedAt: number | null;
  onGameInfo: (key: keyof GameInfo, value: string) => void;
  onNavigate: (view: string) => void;
};

const STEPS = [
  { title: "Assess", text: "What exists today?" },
  { title: "Classify", text: "Reuse, extend, refactor, rewrite, new or remove?" },
  { title: "Plan", text: "How will Prime support be built?" },
  { title: "Estimate", text: "Person-days and risks" },
];

const GAME_FIELDS: { key: keyof GameInfo; label: string; placeholder?: string }[] = [
  { key: "gameName", label: "Game name" },
  { key: "developer", label: "Developer / team", placeholder: "Name or team" },
  { key: "currentUnity", label: "Current Unity version", placeholder: "e.g. 2020.3 LTS" },
  { key: "currentAndroidApi", label: "Current Android API / SDK", placeholder: "If known" },
];

export default function OverviewView({ state, savedAt, onGameInfo, onNavigate }: Props) {
  const isDone = (q: Question) => isQuestionDone(state, q);
  const next = ASSESSMENT_SECTIONS.find((s) => questions.some((q) => q.section === s && !isDone(q)));
  const nextQs = questions.filter((q) => q.section === next);
  const remaining = questions.filter((q) => !isDone(q)).length;
  const stepDone = [
    assessmentCoverage(state) === 100,
    questions.every((q) => state.responses[q.id]?.classification),
    planCoverage(state) === 100,
    totalPlanDays(state) > 0 && state.plan.every((w) => w.personDays > 0),
  ];

  return (
    <>
      <PageHeader title="Overview" crumb={`${state.gameInfo.gameName || "Untitled game"} → Gamesroomz Prime`} savedAt={savedAt} />
      <div className="content">
        {next && (
          <div className="resume">
            <div>
              <b>Continue with {next}</b>
              <p>{nextQs.filter((q) => isDone(q)).length} of {nextQs.length} answered · {remaining} questions left overall</p>
            </div>
            <button type="button" className="btn" onClick={() => onNavigate(next)}>Resume assessment →</button>
          </div>
        )}

        <section className="card">
          <h2>Define what “redo” actually means</h2>
          <p className="lead">
            Separate reusable game content from real Prime conversion work. Assess the existing game, classify every area,
            then document the implementation plan, dependencies, risks and person-days for each workstream.
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

        <div className="grid-2">
          <section className="card">
            <span className="label">Game information</span>
            <div className="form-grid">
              {GAME_FIELDS.map((f) => (
                <div className="field" key={f.key}>
                  <label htmlFor={`gi-${f.key}`}>{f.label}</label>
                  <input type="text" id={`gi-${f.key}`} value={state.gameInfo[f.key]} placeholder={f.placeholder} onChange={(e) => onGameInfo(f.key, e.target.value)} />
                </div>
              ))}
            </div>
          </section>
          <section className="card">
            <span className="label">Target conversion</span>
            <dl className="facts">
              <dt>Prime OS</dt><dd>Android</dd>
              <dt>Prime screen</dt><dd>16:9 tabletop display</dd>
              <dt>Existing game</dt><dd>{state.gameInfo.currentMultiplayer}</dd>
              <dt>Prime target</dt><dd>{state.gameInfo.targetPlayers}</dd>
              <dt>Game layout</dt><dd>Two vertical P1/P2 playfields</dd>
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}
