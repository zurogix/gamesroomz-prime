import {
  assessmentCoverage,
  assessmentSummary,
  attentionItems,
  canSetStatus,
  effortDays,
  hasEstimate,
  planCoverage,
  reviewBlockers,
  totalPlanDays,
  workstreamIssues,
} from "@/lib/assessment";
import { CLASS_LABEL, CONFIRMATIONS, formatDays } from "@/lib/sections";
import { AssessmentState } from "@/lib/types";
import ApprovalTimeline from "./ApprovalTimeline";
import EffortChart from "./EffortChart";
import PageHeader from "./PageHeader";
import RiskMatrix from "./RiskMatrix";
type Props = {
  state: AssessmentState;
  savedAt: number | null;
  onOpenWorkstream: (id: string) => void;
  onStatus: (status: AssessmentState["status"]) => void;
  onToggleCheck: (index: number) => void;
};
export default function SummaryView({
  state,
  savedAt,
  onOpenWorkstream,
  onStatus,
  onToggleCheck,
}: Props) {
  const summary = assessmentSummary(state);
  const mandatory = state.plan
    .filter((w) => w.scopeType === "mandatory")
    .reduce((sum, w) => sum + effortDays(w), 0);
  const optional = totalPlanDays(state) - mandatory;
  const estimated = state.plan.filter(hasEstimate).length;
  const blockers = reviewBlockers(state);
  const unresolved = attentionItems(state);
  const amount = (scope: "mandatory" | "enhancement", days: number) => {
    const scoped = state.plan.filter((w) => w.scopeType === scope);
    return !scoped.length
      ? "0"
      : scoped.some(hasEstimate)
        ? formatDays(days)
        : "—";
  };
  return (
    <>
      <PageHeader
        title="Management Summary"
        crumb="Required changes, evidence and effort"
        savedAt={savedAt}
        actions={
          <button type="button" className="btn" onClick={() => window.print()}>
            Print report
          </button>
        }
      />
      <div className="content">
        <section className="report-head">
          <div>
            <span className="label">Prime conversion assessment</span>
            <h2>{state.gameInfo.gameName || "Untitled game"}</h2>
            <p>
              Mobile PvP → two players sharing one Prime tabletop. Estimates
              cover the changes listed below.
            </p>
          </div>
          <div className="verdict">
            <span>Assessment status</span>
            <b>{summary.label}</b>
            <small>
              {estimated}/{state.plan.length} workstreams estimated
            </small>
          </div>
        </section>
        <div className="kpis">
          <div className="kpi">
            <span className="label">Mandatory conversion</span>
            <b className="num">{amount("mandatory", mandatory)}</b>
            <small>
              person-days{summary.ready ? "" : " · partial estimate"}
            </small>
          </div>
          <div className="kpi">
            <span className="label">Optional enhancements</span>
            <b className="num">{amount("enhancement", optional)}</b>
            <small>person-days · excluded from mandatory total</small>
          </div>
          <div className="kpi">
            <span className="label">Assessment</span>
            <b className="num">{assessmentCoverage(state)}%</b>
            <small>findings resolved with evidence</small>
          </div>
          <div className="kpi">
            <span className="label">Plan reviewed</span>
            <b className="num">{planCoverage(state)}%</b>
            <small>complete, consistent workstreams</small>
          </div>
        </div>
        <p className="hint">
          Person-days measure effort, not calendar duration. Enter each task
          once. Workstream estimates include implementation and developer
          testing; shared QA belongs in the QA workstream. Unestimated work is
          not zero effort.
        </p>
        {blockers.length > 0 && (
          <section className="card">
            <h2>Before this estimate is ready for review</h2>
            <ul>
              {blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </section>
        )}
        <section className="card">
          <h2>Agreed target and assumptions</h2>
          <dl className="facts">
            <dt>Hardware</dt>
            <dd>{state.gameInfo.targetHardware || "Awaiting confirmation"}</dd>
            <dt>Unity / SDK baseline</dt>
            <dd>{state.gameInfo.targetUnity || "Awaiting confirmation"}</dd>
            <dt>Layout</dt>
            <dd>{state.gameInfo.targetLayout || "Awaiting confirmation"}</dd>
            <dt>Platform contract</dt>
            <dd>
              {state.gameInfo.platformContract || "Awaiting confirmation"}
            </dd>
            <dt>Performance targets</dt>
            <dd>
              {state.gameInfo.performanceTarget || "Awaiting confirmation"}
            </dd>
          </dl>
        </section>
        <section className="card report-changes">
          <h2>Required changes by workstream</h2>
          <p className="hint">
            Classification applies only to the named workstream. New platform
            support does not imply rewriting the game.
          </p>
          <div className="table-wrap">
            <table className="change-report">
              <thead>
                <tr>
                  <th>Workstream / action</th>
                  <th>Finding and required work</th>
                  <th>Acceptance / dependencies</th>
                  <th>Effort</th>
                </tr>
              </thead>
              <tbody>
                {state.plan.map((w) => (
                  <tr key={w.id}>
                    <td>
                      <button
                        type="button"
                        className="report-link"
                        onClick={() => onOpenWorkstream(w.id)}
                      >
                        {w.title}
                      </button>
                      <p>
                        {w.classification
                          ? CLASS_LABEL[w.classification]
                          : "Unassessed"}{" "}
                        ·{" "}
                        {w.scopeType === "mandatory" ? "Mandatory" : "Optional"}
                      </p>
                      <small>
                        {workstreamIssues(state, w).length
                          ? "Review incomplete"
                          : "Reviewed"}
                        {w.risk ? ` · ${w.risk} risk` : ""}
                      </small>
                    </td>
                    <td>
                      <p>
                        <b>Finding:</b> {w.whyChange || "Not documented"}
                      </p>
                      {w.classification !== "na" && (
                        <>
                          <p>
                            <b>Plan:</b>{" "}
                            {w.proposedImplementation || "Not documented"}
                          </p>
                          {w.reusedComponents && (
                            <p>
                              <b>Reuse:</b> {w.reusedComponents}
                            </p>
                          )}
                          {w.changedComponents && (
                            <p>
                              <b>Change:</b> {w.changedComponents}
                            </p>
                          )}
                        </>
                      )}
                    </td>
                    <td>
                      {w.classification === "na" ? (
                        "Excluded from scope"
                      ) : (
                        <>
                          <p>{w.deliverable || "Acceptance not documented"}</p>
                          <p>
                            <b>Dependencies:</b>{" "}
                            {w.dependencies || "Not documented"}
                          </p>
                        </>
                      )}
                    </td>
                    <td>
                      {w.classification === "na"
                        ? "0"
                        : formatDays(w.personDays)}{" "}
                      d{!hasEstimate(w) && <small>Estimate needed</small>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        {unresolved.length > 0 && (
          <section className="card">
            <h2>Unresolved assessment findings</h2>
            <ul>
              {unresolved.map(({ question, kind }) => (
                <li key={question.id}>
                  <b>{question.prompt}</b>
                  <p>
                    {kind === "awaiting"
                      ? "Awaiting specification"
                      : kind === "unsure"
                        ? "Needs investigation"
                        : kind === "reason"
                          ? "Evidence missing"
                          : "Not assessed"}{" "}
                    —{" "}
                    {state.responses[question.id]?.explanation ||
                      "Next check not documented"}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
        <EffortChart plan={state.plan} />
        <RiskMatrix plan={state.plan} onOpen={onOpenWorkstream} />
        <section className="card">
          <h2>Developer confirmation</h2>
          <div className="checks">
            {CONFIRMATIONS.map((text, i) => (
              <label key={text} htmlFor={`chk-${i}`}>
                <input
                  type="checkbox"
                  id={`chk-${i}`}
                  checked={state.checks[i]}
                  onChange={() => onToggleCheck(i)}
                />
                {text}
              </label>
            ))}
          </div>
          <p className="hint">
            Changing findings, target requirements or the plan clears these
            confirmations. This prototype records review status locally; it does
            not authenticate an approver.
          </p>
          <ApprovalTimeline
            status={state.status}
            onChange={onStatus}
            canChange={(status) => canSetStatus(state, status)}
          />
          {!canSetStatus(state, "submitted") && (
            <p className="hint">
              Submission and approval require resolved findings, complete
              reviewed plans, confirmed targets and all developer confirmations.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
