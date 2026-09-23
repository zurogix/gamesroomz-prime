import { effortDays, hasEstimate } from "@/lib/assessment";
import { CSSProperties } from "react";
import { CLASSES, CLASS_LABEL, formatDays } from "@/lib/sections";
import { Workstream } from "@/lib/types";

const TICK_COUNT = 5;
const TICK_STEP = 5;

export default function EffortChart({ plan }: { plan: Workstream[] }) {
  const largest = Math.max(0, ...plan.map((w) => effortDays(w)));
  const max = Math.max(TICK_STEP, Math.ceil(largest / TICK_STEP) * TICK_STEP);
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => (max * i) / TICK_COUNT);
  const sorted = [...plan].sort((a, b) => effortDays(b) - effortDays(a));

  return (
    <section className="card">
      <div className="toolbar">
        <h2>Effort by workstream</h2>
        <div className="legend legend-inline">
          {CLASSES.map((c) => <span key={c} style={{ "--c": `var(--${c})` } as CSSProperties}>{CLASS_LABEL[c]}</span>)}
        </div>
      </div>
      <div className="hbars">
        {sorted.map((w) => (
          <div className="hbar" key={w.id} title={`${w.title}: ${formatDays(w.personDays)} person-days`}>
            <span className="name">{w.title}</span>
            <span className="track">
              <i style={{ width: `${(effortDays(w) / max) * 100}%`, "--c": `var(--${w.classification || "line-2"})` } as CSSProperties} />
            </span>
            <span className="v">{w.classification === "na" ? "N/A" : hasEstimate(w) ? formatDays(w.personDays) : "—"}</span>
          </div>
        ))}
      </div>
      <div className="axis" aria-hidden="true">
        <span />
        <div>{ticks.map((t) => <span key={t}>{formatDays(t)}</span>)}</div>
        <span>days</span>
      </div>
    </section>
  );
}

