"use client";

import { useState } from "react";
import { engineAssessmentIssues, planFieldsDone, PLAN_FIELD_COUNT, totalPlanDays } from "@/lib/assessment";
import { formatDays, SUMMARY } from "@/lib/sections";
import { AssessmentState, EngineOptionEstimate, MultiplayerEngineAssessment, Workstream } from "@/lib/types";
import MultiplayerEnginePanel from "./MultiplayerEnginePanel";
import PageHeader from "./PageHeader";
import PlanTableRow from "./PlanTableRow";

type SortKey = "title" | "classification" | "risk" | "scopeType" | "personDays" | "done";

type Props = {
  state: AssessmentState;
  savedAt: number | null;
  onOpen: (id: string) => void;
  onEngineChange: (patch: Partial<MultiplayerEngineAssessment>) => void;
  onEngineOptionChange: (option: "sharedCore" | "separatePrime", patch: Partial<EngineOptionEstimate>) => void;
  onNavigate: (view: string) => void;
};

const RISK_ORDER = { low: 0, medium: 1, high: 2 };
const CLASS_ORDER = { "": -1, reuse: 0, remove: 1, extend: 2, refactor: 3, rewrite: 4, new: 5 };
const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: "title", label: "Workstream" },
  { key: "classification", label: "Action" },
  { key: "risk", label: "Risk" },
  { key: "scopeType", label: "Scope" },
  { key: "personDays", label: "Days", numeric: true },
  { key: "done", label: "Completeness" },
];
const GROUPS = [
  { scope: "mandatory", label: "Mandatory Prime conversion" },
  { scope: "enhancement", label: "Optional enhancements" },
];

function sortValue(w: Workstream, key: SortKey): string | number {
  if (key === "risk") return RISK_ORDER[w.risk];
  if (key === "classification") return CLASS_ORDER[w.classification];
  if (key === "done") return planFieldsDone(w);
  if (key === "personDays") return Number(w.personDays) || 0;
  return w[key];
}

export default function PlanView({ state, savedAt, onOpen, onEngineChange, onEngineOptionChange, onNavigate }: Props) {
  const [sort, setSort] = useState<{ key: SortKey | null; dir: number }>({ key: null, dir: 1 });
  const [grouped, setGrouped] = useState(false);

  const rows = [...state.plan];
  const { key, dir } = sort;
  if (key) rows.sort((a, b) => (sortValue(a, key) > sortValue(b, key) ? 1 : sortValue(a, key) < sortValue(b, key) ? -1 : 0) * dir);

  const toggleSort = (k: SortKey) => setSort((s) => ({ key: k, dir: s.key === k ? -s.dir : 1 }));
  const incomplete = state.plan.filter((w) => planFieldsDone(w) < PLAN_FIELD_COUNT).length;
  const renderRow = (w: Workstream) => <PlanTableRow key={w.id} workstream={w} onOpen={onOpen} />;
  const crumb = <>Plan <span>·</span> {state.plan.length} workstreams <span>·</span> {formatDays(totalPlanDays(state))} person-days</>;

  return (
    <>
      <PageHeader title="Conversion Plan" crumb={crumb} savedAt={savedAt} />
      <div className="content">
        <div className="toolbar">
          <div className="seg" role="group" aria-label="Grouping">
            <button type="button" className={!grouped ? "on" : ""} aria-pressed={!grouped} onClick={() => setGrouped(false)}>All workstreams</button>
            <button type="button" className={grouped ? "on" : ""} aria-pressed={grouped} onClick={() => setGrouped(true)}>Mandatory vs enhancement</button>
          </div>
          <span className="hint">Click a row to edit it. Click a column header to sort.</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <th key={c.key} className={c.numeric ? "n" : ""} aria-sort={key === c.key ? (dir > 0 ? "ascending" : "descending") : undefined}>
                    <button type="button" onClick={() => toggleSort(c.key)}>
                      {c.label}{key === c.key ? (dir > 0 ? " ↑" : " ↓") : ""}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!grouped && rows.map(renderRow)}
              {grouped && GROUPS.map((g) => {
                const items = rows.filter((w) => w.scopeType === g.scope);
                const days = items.reduce((sum, w) => sum + (Number(w.personDays) || 0), 0);
                return [
                  <tr className="group" key={g.scope}>
                    <td colSpan={4}>{g.label} · {items.length}</td>
                    <td className="n">{formatDays(days)}</td>
                    <td />
                  </tr>,
                  ...items.map(renderRow),
                  items.length === 0 && (
                    <tr className="group empty" key={`${g.scope}-empty`}>
                      <td colSpan={6}>No workstreams yet — set a workstream’s scope to Enhancement to move it here.</td>
                    </tr>
                  ),
                ];
              })}
            </tbody>
          </table>
        </div>

        <div id="engine-options">
          <MultiplayerEnginePanel
            value={state.engineAssessment}
            issues={engineAssessmentIssues(state.engineAssessment)}
            onChange={onEngineChange}
            onOptionChange={onEngineOptionChange}
          />
        </div>

        <div className="pager">
          <span className="hint">{incomplete} workstreams with details still to add</span>
          <button type="button" className="btn primary" onClick={() => onNavigate(SUMMARY)}>Generate management summary →</button>
        </div>
      </div>
    </>
  );
}
