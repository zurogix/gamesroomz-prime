import { CSSProperties } from "react";
import {
  assessmentCoverage,
  calculateComplexity,
  deriveFindings,
  engineOptionTotal,
  planCoverage,
  totalPlanDays,
} from "@/lib/assessment";
import { CLASSES, CLASS_LABEL, CONFIRMATIONS, formatDays } from "@/lib/sections";
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

export default function SummaryView({ state, savedAt, onOpenWorkstream, onStatus, onToggleCheck }: Props) {
  const complexity = calculateComplexity(state);
  const total = totalPlanDays(state);
  const mandatory = state.plan.filter((w) => w.scopeType === "mandatory").reduce((sum, w) => sum + (Number(w.personDays) || 0), 0);
  const enhancement = total - mandatory;
  const highRisk = state.plan.filter((w) => w.risk === "high");
  const findings = deriveFindings(state);
  const confirmed = state.checks.filter(Boolean).length;
  const printButton = <button type="button" className="btn" onClick={() => window.print()}>Print report</button>;

  return (
    <>
      <PageHeader title="Management Summary" crumb={<>Report <span>·</span> Prepared for scope approval</>} savedAt={savedAt} actions={printButton} />
      <div className="content">
        <section className="report-head">
          <div>
            <span className="label">Prime conversion assessment</span>
            <h2>{state.gameInfo.gameName || "Untitled game"}</h2>
            <p>Existing mobile PvP → shared-device Prime multiplayer on Android, 16:9 tabletop display, simultaneous multi-touch and Gamesroomz integration.</p>
          </div>
          <div className="verdict">
            <span>Overall conversion scope</span>
            <b>{complexity.label}</b>
            <small>{formatDays(total)} person-days across {state.plan.length} workstreams</small>
          </div>
        </section>

        <div className="kpis">
          <div className="kpi"><span className="label">Planned effort</span><b className="num">{formatDays(total)}</b><small>person-days</small></div>
          <div className="kpi"><span className="label">Assessment</span><b className="num">{assessmentCoverage(state)}%</b><small>questions answered & classified</small></div>
          <div className="kpi"><span className="label">Plan detail</span><b className="num">{planCoverage(state)}%</b><small>workstreams fully documented</small></div>
          <div className="kpi"><span className="label">High risk</span><b className="num">{highRisk.length}</b><small>{highRisk.length ? highRisk.map((w) => w.title).join(", ") : "none"}</small></div>
        </div>

        <section className="card engine-summary-card">
          <div className="engine-summary-head">
            <div>
              <span className="label">Multiplayer architecture decision</span>
              <h2>Engine 2.0 vs separate Prime engine</h2>
            </div>
            <span className="engine-strategy-badge">
              {state.engineAssessment.strategy
                ? state.engineAssessment.strategy[0].toUpperCase() + state.engineAssessment.strategy.slice(1)
                : "Not classified"}
            </span>
          </div>
          <div className="engine-summary-grid">
            <div>
              <span className="label">Shared Multiplayer Engine 2.0</span>
              <b className="num">{formatDays(engineOptionTotal(state.engineAssessment.sharedCore))} d</b>
              <small>
                Shared code: {state.engineAssessment.sharedCore.sharedCode || "—"} · Risk: {state.engineAssessment.sharedCore.risk}
              </small>
              <p>{state.engineAssessment.sharedCore.maintenanceImpact || "Maintenance impact not documented yet."}</p>
            </div>
            <div>
              <span className="label">Separate Prime Multiplayer Engine</span>
              <b className="num">{formatDays(engineOptionTotal(state.engineAssessment.separatePrime))} d</b>
              <small>
                Shared code: {state.engineAssessment.separatePrime.sharedCode || "—"} · Risk: {state.engineAssessment.separatePrime.risk}
              </small>
              <p>{state.engineAssessment.separatePrime.maintenanceImpact || "Maintenance impact not documented yet."}</p>
            </div>
          </div>
          <div className="engine-summary-meta">
            <span><b>Framework:</b> {state.engineAssessment.networkingFramework || "Not documented"}</span>
            <span><b>State/update model:</b> {state.engineAssessment.stateUpdateModel || "Not documented"}</span>
          </div>
          {state.engineAssessment.strategy === "replace" && (
            <div className="engine-summary-replace">
              <b>Replace justification</b>
              <p>{state.engineAssessment.replaceReason || "Required technical justification is missing."}</p>
              <b>Reusable components</b>
              <p>{state.engineAssessment.reusableComponents || "Reusable components have not been identified."}</p>
            </div>
          )}
        </section>

        <EffortChart plan={state.plan} />

        <div className="grid-2">
          <RiskMatrix plan={state.plan} onOpen={onOpenWorkstream} />
          <section className="card">
            <h2>Mandatory vs enhancement</h2>
            <div className="split">
              <div className="split-mandatory" style={{ flex: mandatory || 0.0001 }}>Mandatory {formatDays(mandatory)} d</div>
              {enhancement > 0 && <div className="split-enhancement" style={{ flex: enhancement }}>Enhancement {formatDays(enhancement)} d</div>}
            </div>
            {enhancement === 0 && (
              <span className="hint">All planned work is currently mandatory Prime conversion. Mark optional work as Enhancement in the plan to separate it here.</span>
            )}
            <h2 className="subhead">Approval status</h2>
            <ApprovalTimeline status={state.status} onChange={onStatus} />
          </section>
        </div>

        <section className="card">
          <h2>What “redo” means for this game</h2>
          <div className="findings">
            {CLASSES.map((c) => (
              <div key={c} style={{ "--c": `var(--${c})`, "--bg-c": `var(--${c}-bg)` } as CSSProperties}>
                <b>{c === "new" ? "New development" : CLASS_LABEL[c]} · {findings[c].length}</b>
                {findings[c].length ? (
                  <ul>{findings[c].map((t) => <li key={t}>{t}</li>)}</ul>
                ) : (
                  <span className="hint">None classified.</span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>Developer confirmation</h2>
          <div className="checks">
            {CONFIRMATIONS.map((text, i) => (
              <label key={text} htmlFor={`chk-${i}`}>
                <input type="checkbox" id={`chk-${i}`} checked={state.checks[i]} onChange={() => onToggleCheck(i)} />
                {text}
              </label>
            ))}
          </div>
          <span className="hint">{confirmed} of {CONFIRMATIONS.length} confirmed · saved with the draft</span>
        </section>
      </div>
    </>
  );
}
