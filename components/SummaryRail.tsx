import {
  assessmentCoverage,
  assessmentSummary,
  attentionItems,
  planCoverage,
  totalPlanDays,
  targetGaps,
  hasEstimate,
} from "@/lib/assessment";
import { formatDays } from "@/lib/sections";
import { AssessmentState } from "@/lib/types";
type Props = {
  state: AssessmentState;
  onJumpToQuestion: (id: string) => void;
  onOpenWorkstream: (id: string) => void;
};
export default function SummaryRail({
  state,
  onJumpToQuestion,
  onOpenWorkstream,
}: Props) {
  const summary = assessmentSummary(state);
  const attention = attentionItems(state);
  const estimated = state.plan.filter(hasEstimate).length;
  return (
    <aside className="rail" aria-label="Live summary">
      <section>
        <span className="label">Assessment status</span>
        <div className="rail-verdict">{summary.label}</div>
        <p className="hint">
          Required changes and effort are reviewed by workstream. No automatic
          “redo” verdict.
        </p>
      </section>
      <section>
        <span className="label">
          {summary.ready ? "Estimated effort" : "Entered effort · partial"}
        </span>
        <div className="big num">
          {estimated ? formatDays(totalPlanDays(state)) : "—"}
          <small>person-days</small>
        </div>
        <p className="hint">
          {estimated}/{state.plan.length} workstreams estimated. Mandatory and
          optional totals are separate in the report.
        </p>
        <div className="progress-line">
          <span>Assessment</span>
          <span>{assessmentCoverage(state)}%</span>
        </div>
        <div className="bar">
          <i style={{ width: `${assessmentCoverage(state)}%` }} />
        </div>
        <div className="progress-line">
          <span>Plan reviewed</span>
          <span>{planCoverage(state)}%</span>
        </div>
        <div className="bar">
          <i style={{ width: `${planCoverage(state)}%` }} />
        </div>
      </section>
      {targetGaps(state).length > 0 && (
        <section>
          <span className="label">Target requirements to confirm</span>
          <ul>
            {targetGaps(state).map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
          <span className="hint">Record these in Overview.</span>
        </section>
      )}
      <section>
        <span className="label">Findings to resolve · {attention.length}</span>
        <div className="att">
          {attention.length === 0 && (
            <span className="hint">All findings documented.</span>
          )}
          {attention.slice(0, 5).map(({ question, kind }) => (
            <button
              key={question.id}
              type="button"
              onClick={() => onJumpToQuestion(question.id)}
            >
              <span>
                {kind === "reason"
                  ? "Evidence missing"
                  : kind === "awaiting"
                    ? "Awaiting specification"
                    : kind === "unsure"
                      ? "Needs investigation"
                      : "Not assessed"}
                <em>{question.prompt}</em>
              </span>
            </button>
          ))}
        </div>
        {attention.length > 5 && <p className="hint">{attention.length - 5} more findings to resolve. Use the section progress to continue; the report lists all unresolved items.</p>}
      </section>
      <section>
        <span className="label">High-risk workstreams</span>
        <div className="att">
          {state.plan
            .filter((w) => w.risk === "high" && w.classification !== "na")
            .map((w) => (
              <button
                type="button"
                key={w.id}
                onClick={() => onOpenWorkstream(w.id)}
              >
                <span>
                  {w.title}
                  <em>{formatDays(w.personDays)} person-days</em>
                </span>
              </button>
            ))}
        </div>
      </section>
    </aside>
  );
}
