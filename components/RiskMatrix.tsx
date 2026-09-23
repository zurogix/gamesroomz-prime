import { hasEstimate } from "@/lib/assessment";
import { Fragment } from "react";
import { Risk, Workstream } from "@/lib/types";

type Props = { plan: Workstream[]; onOpen: (id: string) => void };

const RISK_ROWS: { risk: Risk; label: string }[] = [
  { risk: "high", label: "High risk" },
  { risk: "medium", label: "Medium" },
  { risk: "low", label: "Low risk" },
];
const EFFORT_COLUMNS = ["≤ 3 days", "> 3–7 days", "> 7 days"];
const SMALL_MAX_DAYS = 3;
const MEDIUM_MAX_DAYS = 7;
const TITLE_SUFFIX = / (Architecture|Integration|Modernization|& Stabilization|Input|Lifecycle)$/;

function effortColumn(days: number) {
  if (days <= SMALL_MAX_DAYS) return 0;
  if (days <= MEDIUM_MAX_DAYS) return 1;
  return 2;
}

function cellTone(row: number, col: number) {
  if (row === 0 && col >= 1) return "hot";
  if ((row === 0 && col === 0) || (row === 1 && col === 2)) return "warm";
  return "";
}

export default function RiskMatrix({ plan, onOpen }: Props) {
  return (
    <section className="card">
      <h2>Risk × effort</h2>
      <div className="matrix">
        <span />
        {EFFORT_COLUMNS.map((c) => <span key={c} className="ax">{c}</span>)}
        {RISK_ROWS.map((row, r) => (
          <Fragment key={row.risk}>
            <span className="ax">{row.label}</span>
            {EFFORT_COLUMNS.map((_, c) => (
              <div key={c} className={`cell ${cellTone(r, c)}`}>
                {plan
                  .filter((w) => w.classification !== "na" && hasEstimate(w) && w.risk === row.risk && effortColumn(Number(w.personDays) || 0) === c)
                  .map((w) => (
                    <button key={w.id} type="button" className="tag" onClick={() => onOpen(w.id)}>
                      {w.title.replace(TITLE_SUFFIX, "")}
                    </button>
                  ))}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
      <span className="hint">Only assessed risks with valid estimates appear here. Top-right cells need the most attention.</span>
    </section>
  );
}

