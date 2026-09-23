"use client";

import { useEffect, useState } from "react";
import { planFieldsDone, PLAN_FIELD_COUNT } from "@/lib/assessment";
import { formatDays } from "@/lib/sections";
import { AssessmentState, Workstream } from "@/lib/types";
import ClassificationChip from "./ClassificationChip";
import PlanDrawerFields from "./PlanDrawerFields";
import RiskLabel from "./RiskLabel";
import { questions } from "@/lib/questions";
import { CLASS_LABEL } from "@/lib/sections";

export type DrawerTab = "plan" | "detail";

type Props = {
  plan: Workstream[];
  responses: AssessmentState["responses"];
  openId: string;
  onChange: (id: string, patch: Partial<Workstream>) => void;
  onSelect: (id: string) => void;
  onClose: () => void;
};

const TABS: { key: DrawerTab; label: string }[] = [
  { key: "plan", label: "Plan & estimate" },
  { key: "detail", label: "Supporting detail" },
];

export default function PlanDrawer({ plan, responses, openId, onChange, onSelect, onClose }: Props) {
  const [tab, setTab] = useState<DrawerTab>("plan");
  const index = plan.findIndex((w) => w.id === openId);
  const w = plan[index];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!w) return null;
  const step = (delta: number) => plan[index + delta] && onSelect(plan[index + delta].id);

  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={w.title}>
        <div className="drawer-head">
          <div>
            <div className="crumb">Workstream {index + 1} of {plan.length} · {planFieldsDone(w)}/{PLAN_FIELD_COUNT} complete</div>
            <h2>{w.title}</h2>
            <div className="drawer-meta">
              {w.classification && <ClassificationChip value={w.classification} />}
              <RiskLabel risk={w.risk} suffix=" risk" />
              <span className="hint num">{formatDays(w.personDays)} d</span>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.key} type="button" role="tab" className={tab === t.key ? "on" : ""} aria-selected={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="drawer-body">
          <p className="hint">{w.primeRequirement}</p>
          <details className="linked-findings"><summary>Linked assessment findings</summary>
            {questions.filter(q => q.workstream === w.id).map(q => {
              const r = responses[q.id];
              return <div key={q.id}><b>{q.prompt}</b><p>{r?.classification ? CLASS_LABEL[r.classification] : r?.answer === "awaiting" ? "Awaiting specification" : r?.answer === "unsure" ? "Needs investigation" : "Not assessed"}</p><p>{r?.explanation || "Evidence not documented"}</p></div>;
            })}
          </details>
          <PlanDrawerFields workstream={w} tab={tab} onChange={(patch) => onChange(w.id, patch)} />
        </div>
        <div className="drawer-foot">
          <button type="button" className="btn" disabled={index === 0} onClick={() => step(-1)}>← Previous</button>
          <button type="button" className="btn" disabled={index === plan.length - 1} onClick={() => step(1)}>Next workstream →</button>
        </div>
      </aside>
    </>
  );
}

