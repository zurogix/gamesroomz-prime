import { CSSProperties, ReactNode } from "react";
import { deriveFindings, planCoverage, totalPlanDays } from "@/lib/assessment";
import { ExportResponse } from "@/lib/exportMarkdown";
import { scopeProfile } from "@/lib/scopeProfile";
import { CLASSES, CLASS_LABEL, CONFIRMATIONS, formatDays } from "@/lib/sections";
import { statusLabel } from "@/lib/stages";
import { AssessmentState } from "@/lib/types";
import EffortChart from "./EffortChart";
import EngineSummaryCard from "./EngineSummaryCard";
import ExportMenu from "./ExportMenu";
import PageHeader from "./PageHeader";
import RiskMatrix from "./RiskMatrix";
import ScopeProfileCard from "./ScopeProfileCard";

type Props = {
  state: AssessmentState;
  onOpenWorkstream: (id: string) => void;
  /** e.g. "2 of 3" developers submitted, or the developer's own discovery status. */
  discoveryKpi: { value: string; detail: string };
  /** Answers included in "Export answers". */
  exportResponses: ExportResponse[];
  stageActions?: ReactNode;
  historySlot?: ReactNode;
};

export default function SummaryView({ state, onOpenWorkstream, discoveryKpi, exportResponses, stageActions, historySlot }: Props) {
  const profile = scopeProfile(state.plan);
  const total = totalPlanDays(state);
  const mandatory = state.plan.filter((w) => w.scopeType === "mandatory").reduce((sum, w) => sum + (Number(w.personDays) || 0), 0);
  const enhancement = total - mandatory;
  const highRisk = state.plan.filter((w) => w.risk === "high");
  const findings = deriveFindings(state);
  const confirmed = state.checks.filter(Boolean).length;
  const actions = (
    <>
      <ExportMenu state={state} responses={exportResponses} />
      <button type="button" className="btn" onClick={() => window.print()}>Print report</button>
      {stageActions}
    </>
  );

  return (
    <>
      <PageHeader title="Management Summary" crumb={<>Report <span>·</span> Prepared for a shared scope agreement</>} actions={actions} />
      <div className="content">
        <section className="report-head">
          <div>
            <span className="label">Prime conversion assessment</span>
            <h2>{state.gameInfo.gameName || "Untitled game"}</h2>
            <p>Existing mobile PvP → Gamesroomz Prime.</p>
            <p>Status: {statusLabel(state.status)} · Developer confirmations: {confirmed} of {CONFIRMATIONS.length}</p>
          </div>
          <div className="verdict">
            <span>Scope profile</span>
            <b>{profile.incomplete ?? `${formatDays(total)} person-days`}</b>
            <small>{state.plan.length} workstreams · {profile.game.count} game, {profile.platform.count} platform</small>
          </div>
        </section>

        <div className="kpis">
          <div className="kpi"><span className="label">Planned effort</span><b className="num">{formatDays(total)}</b><small>person-days</small></div>
          <div className="kpi"><span className="label">Discovery</span><b className="num">{discoveryKpi.value}</b><small>{discoveryKpi.detail}</small></div>
          <div className="kpi"><span className="label">Plan detail</span><b className="num">{planCoverage(state)}%</b><small>workstreams fully documented</small></div>
          <div className="kpi"><span className="label">High risk</span><b className="num">{highRisk.length}</b><small>{highRisk.length ? highRisk.map((w) => w.title).join(", ") : "none"}</small></div>
        </div>

        <ScopeProfileCard profile={profile} />

        <EngineSummaryCard engine={state.engineAssessment} />

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
              <span className="hint">All planned work is currently marked as required for Prime. Mark optional work as Enhancement in the plan to show it separately.</span>
            )}
          </section>
        </div>

        <section className="card">
          <h2>Workstreams by label</h2>
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

        {historySlot}
      </div>
    </>
  );
}
