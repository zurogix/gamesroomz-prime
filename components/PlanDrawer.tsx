"use client";

import { useEffect, useState } from "react";
import { planFieldsDone, PLAN_FIELD_COUNT } from "@/lib/assessment";
import { formatDays } from "@/lib/sections";
import { Workstream } from "@/lib/types";
import ClassificationChip from "./ClassificationChip";
import PlanDrawerFields from "./PlanDrawerFields";
import RiskLabel from "./RiskLabel";

export type DrawerTab = "overview" | "impl" | "comp" | "effort";

type Props = {
  plan: Workstream[];
  openId: string;
  onChange: (id: string, patch: Partial<Workstream>) => void;
  onSelect: (id: string) => void;
  onClose: () => void;
};

const TABS: { key: DrawerTab; label: string }[] = [
  { key: "overview", label: "Current vs Prime" },
  { key: "impl", label: "Implementation" },
  { key: "comp", label: "Components" },
  { key: "effort", label: "Effort & risk" },
];

export default function PlanDrawer({ plan, openId, onChange, onSelect, onClose }: Props) {
  const [tab, setTab] = useState<DrawerTab>("overview");
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
