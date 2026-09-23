import { assessmentCoverage, isQuestionDone, planCoverage, hasEstimate, targetGaps } from "@/lib/assessment";
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
  { title: "Set target", text: "Confirm the Prime requirements" },
  { title: "Assess", text: "Choose the action and record evidence" },
  { title: "Plan", text: "How will Prime support be built?" },
  { title: "Estimate", text: "Person-days and risks" },
];

const GAME_FIELDS: { key: keyof GameInfo; label: string; placeholder?: string }[] = [
  { key: "gameName", label: "Game name" },
  { key: "developer", label: "Developer / team", placeholder: "Name or team" },
  { key: "currentUnity", label: "Current Unity version", placeholder: "e.g. 2020.3 LTS" },
  { key: "currentAndroidApi", label: "Current Android API / SDK", placeholder: "If known" },
];

const TARGET_FIELDS: { key: keyof GameInfo; label: string; placeholder: string }[] = [
  { key: "targetHardware", label: "Prime device / Android OS / screen resolution", placeholder: "Confirmed model, OS/API, CPU and display resolution" },
  { key: "targetUnity", label: "Agreed Unity / SDK baseline", placeholder: "Target version and SDK compatibility, or a confirmed no-upgrade decision" },
  { key: "targetLayout", label: "Seating and playfield layout", placeholder: "Same side or opposite sides, board dimensions and orientation" },
  { key: "platformContract", label: "Gamesroomz / launcher specification", placeholder: "Specification version or link; identity, session, results and offline policy" },
  { key: "performanceTarget", label: "Performance acceptance targets", placeholder: "FPS/frame-time, memory and extended-session test duration" },
];
function downloadLegacy(draft: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = "prime-assessment-previous-draft.json"; a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function OverviewView({ state, savedAt, onGameInfo, onNavigate }: Props) {
  const isDone = (q: Question) => isQuestionDone(state, q);
  const next = ASSESSMENT_SECTIONS.find((s) => questions.some((q) => q.section === s && !isDone(q)));
  const nextQs = questions.filter((q) => q.section === next);
  const remaining = questions.filter((q) => !isDone(q)).length;
  const stepDone = [
    targetGaps(state).length === 0,
    assessmentCoverage(state) === 100,
    planCoverage(state) === 100,
    state.plan.every(hasEstimate),
  ];

  return (
    <>
      <PageHeader title="Overview" crumb={`${state.gameInfo.gameName || "Untitled game"} → Gamesroomz Prime`} savedAt={savedAt} />
      <div className="content">
        {Boolean(state.legacyDraft) && <section className="card"><h2>Earlier draft retained</h2><p>Your game details, plan notes and entered estimates were carried over. The revised questions need fresh answers; plan actions, risk and review must be reconfirmed. The earlier draft remains available for reference.</p><button type="button" className="btn" onClick={() => downloadLegacy(state.legacyDraft)}>Download earlier draft</button></section>}
        {next && (
          <div className="resume">
            <div>
              <b>Continue with {next}</b>
              <p>{nextQs.filter((q) => isDone(q)).length} of {nextQs.length} complete · {remaining} questions left overall</p>
            </div>
            <button type="button" className="btn" onClick={() => onNavigate(next)}>Resume assessment →</button>
          </div>
        )}

        <section className="card">
          <h2>Identify the changes needed for Prime</h2>
          <p className="lead">
            Answer 24 focused questions with a brief finding. Then estimate each workstream once.
            The report separates reusable parts, required changes, optional enhancements and unresolved items.
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
              <dt>Game layout</dt><dd>Two playfields; seating and orientation to confirm below</dd>
            </dl>
          </section>
        </div>
        <section className="card"><h2>Confirm the Prime target</h2><p className="hint">Leave unconfirmed requirements blank and use Awaiting specification in the assessment. These requirements are needed before the estimate is ready for review.</p><div className="form-grid">
          {TARGET_FIELDS.map(f => <div className="field" key={f.key}><label htmlFor={`gi-${f.key}`}>{f.label}</label><textarea id={`gi-${f.key}`} value={state.gameInfo[f.key]} placeholder={f.placeholder} onChange={e => onGameInfo(f.key, e.target.value)} /></div>)}
        </div></section>
      </div>
    </>
  );
}

