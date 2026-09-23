import { CSSProperties } from "react";
import {
  assessmentCoverage,
  attentionItems,
  calculateComplexity,
  classificationCounts,
  planCoverage,
  totalPlanDays,
} from "@/lib/assessment";
import { questions } from "@/lib/questions";
import { CLASSES, CLASS_LABEL, COMPLEXITY_BANDS, formatDays } from "@/lib/sections";
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
  const complexity = calculateComplexity(state);
  const counts = classificationCounts(state);
  const attention = attentionItems(state);
  const highRisk = state.plan.filter((w) => w.risk === "high");
  const assessPct = assessmentCoverage(state);
  const planPct = planCoverage(state);
  const total = questions.length;

  return (
    <aside className="rail" aria-label="Live summary">
      <section>
        <span className="label">Conversion scope</span>
        <div className="rail-verdict">{complexity.label}</div>
        <div className="gauge">
          {COMPLEXITY_BANDS.map((b, i) => <div key={b} className={i <= complexity.index ? "on" : ""} />)}
        </div>
        <div className="gauge-labels">
          {COMPLEXITY_BANDS.map((b, i) => <span key={b} className={i === complexity.index ? "on" : ""}>{b}</span>)}
        </div>
      </section>

      <section>
        <span className="label">Planned effort</span>
        <div className="big num">{formatDays(totalPlanDays(state))}<small>person-days</small></div>
        <div className="progress-line"><span>Assessment</span><span className="num">{assessPct}%</span></div>
        <div className="bar"><i style={{ width: `${assessPct}%` }} /></div>
        <div className="progress-line"><span>Plan</span><span className="num">{planPct}%</span></div>
        <div className="bar"><i style={{ width: `${planPct}%` }} /></div>
      </section>

      <section>
        <span className="label">Impact across {total} questions</span>
        <div className="stack">
          {CLASSES.map((c) => <i key={c} style={{ width: `${(counts[c] / total) * 100}%`, background: `var(--${c})` }} />)}
        </div>
        <div className="legend">
          {CLASSES.map((c) => <span key={c} style={tone(`var(--${c})`)}>{CLASS_LABEL[c]}<b>{counts[c]}</b></span>)}
          <span style={tone("var(--line-2)")}>Unclassified<b>{counts.none}</b></span>
        </div>
      </section>

      <section>
        <span className="label">Needs attention · {attention.length}</span>
        <div className="att">
          {attention.length === 0 && <span className="hint">Nothing flagged.</span>}
          {attention.map(({ question, kind, classification }) => (
            <button
              key={question.id}
              type="button"
              style={tone(kind === "reason" ? `var(--${classification})` : "var(--warn)")}
              onClick={() => onJumpToQuestion(question.id)}
            >
              <i />
              <span>
                {kind === "reason" && classification ? `${CLASS_LABEL[classification]} without an explanation` : "Answered “Not sure”"}
                <em>{question.section} — {preview(question.prompt)}</em>
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
