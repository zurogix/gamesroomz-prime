import { CSSProperties } from "react";
import { planCoverage, totalPlanDays } from "@/lib/assessment";
import { scopeProfile } from "@/lib/scopeProfile";
import { CLASSES, CLASS_LABEL, formatDays } from "@/lib/sections";
import { AssessmentState } from "@/lib/types";

type Props = { state: AssessmentState; onOpenWorkstream: (id: string) => void };

const tone = (c: string) => ({ "--c": c }) as CSSProperties;

/** Scope profile, planned effort and high-risk workstreams for the Conversion Plan. */
export default function RailPlanSummary({ state, onOpenWorkstream }: Props) {
  const profile = scopeProfile(state.plan);
  const highRisk = state.plan.filter((w) => w.risk === "high");
  const total = state.plan.length;
  const planPct = planCoverage(state);
  const countFor = (c: string) => state.plan.filter((w) => w.classification === c).length;

  return (
    <>
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
        <div className="progress-line"><span>Plan detail</span><span className="num">{planPct}%</span></div>
        <div className="bar"><i style={{ width: `${planPct}%` }} /></div>
      </section>

      <section>
        <span className="label">High-risk workstreams · {highRisk.length}</span>
        <div className="att">
          {highRisk.length === 0 && <span className="hint">None marked high risk.</span>}
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
    </>
  );
}
