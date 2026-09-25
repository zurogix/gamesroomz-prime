import { CSSProperties } from "react";
import { planCoverage, totalPlanDays } from "@/lib/assessment";
import { discoveryAttention, discoveryCoverage } from "@/lib/discoveryAnswers";
import { scopeProfile } from "@/lib/scopeProfile";
import { CLASSES, CLASS_LABEL, formatDays } from "@/lib/sections";
import { AssessmentState } from "@/lib/types";

type Props = {
  state: AssessmentState;
  onJumpToQuestion: (id: string) => void;
  onOpenWorkstream: (id: string) => void;
};

const PREVIEW_LENGTH = 64;
const tone = (c: string) => ({ "--c": c }) as CSSProperties;

function preview(text: string) {
  return text.length > PREVIEW_LENGTH ? text.slice(0, PREVIEW_LENGTH) + "…" : text;
}

export default function SummaryRail({ state, onJumpToQuestion, onOpenWorkstream }: Props) {
  const profile = scopeProfile(state.plan);
  const attention = discoveryAttention(state.answers);
  const highRisk = state.plan.filter((w) => w.risk === "high");
  const discoveryPct = discoveryCoverage(state.answers);
  const planPct = planCoverage(state);
  const total = state.plan.length;
  const countFor = (c: string) => state.plan.filter((w) => w.classification === c).length;

  return (
    <aside className="rail" aria-label="Live summary">
      <section>
        <span className="label">Scope profile</span>
        <div className="rail-verdict">{profile.incomplete ?? `${total} workstreams classified`}</div>
        <div className="stack">
          {CLASSES.map((c) => <i key={c} style={{ width: `${(countFor(c) / total) * 100}%`, background: `var(--${c})` }} />)}
        </div>
        <div className="legend">
          {CLASSES.map((c) => <span key={c} style={tone(`var(--${c})`)}>{CLASS_LABEL[c]}<b>{countFor(c)}</b></span>)}
          <span style={tone("var(--line-2)")}>Unclassified<b>{profile.unclassified}</b></span>
        </div>
      </section>

      <section>
        <span className="label">Planned effort</span>
        <div className="big num">{formatDays(totalPlanDays(state))}<small>person-days</small></div>
        <div className="progress-line"><span>Discovery</span><span className="num">{discoveryPct}%</span></div>
        <div className="bar"><i style={{ width: `${discoveryPct}%` }} /></div>
        <div className="progress-line"><span>Plan</span><span className="num">{planPct}%</span></div>
        <div className="bar"><i style={{ width: `${planPct}%` }} /></div>
      </section>

      <section>
        <span className="label">To follow up · {attention.length}</span>
        <div className="att">
          {attention.length === 0 && <span className="hint">Nothing noted yet.</span>}
          {attention.map(({ question, reason }) => (
            <button key={question.id} type="button" style={tone("var(--warn)")} onClick={() => onJumpToQuestion(question.id)}>
              <i />
              <span>
                {question.id} · {reason}
                <em>{preview(question.prompt)}</em>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <span className="label">High-risk workstreams · {highRisk.length}</span>
        <div className="att">
          {highRisk.map((w) => (
            <button key={w.id} type="button" style={tone("var(--risk-high)")} onClick={() => onOpenWorkstream(w.id)}>
              <i />
              <span>
                {w.title}
                <em>{formatDays(w.personDays)} person-days · {w.classification ? CLASS_LABEL[w.classification] : "Unclassified"}</em>
              </span>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}
