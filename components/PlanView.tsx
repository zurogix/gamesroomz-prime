"use client";

import { useState } from "react";
import { planFieldsDone, totalPlanDays, effortDays, hasEstimate, workstreamIssues } from "@/lib/assessment";
import { formatDays, SUMMARY } from "@/lib/sections";
import { AssessmentState, Workstream } from "@/lib/types";
import PageHeader from "./PageHeader";
import PlanTableRow from "./PlanTableRow";

type SortKey = "title" | "classification" | "risk" | "scopeType" | "personDays" | "done";

type Props = {
  state: AssessmentState;
  savedAt: number | null;
  onOpen: (id: string) => void;
  onSync: () => void;
  onNavigate: (view: string) => void;
};

const RISK_ORDER = { "": -1, low: 0, medium: 1, high: 2 };
const CLASS_ORDER = { "": -1, reuse: 0, modify: 1, rewrite: 2, new: 3, na: 4 };
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

export default function PlanView({ state, savedAt, onOpen, onSync, onNavigate }: Props) {
  const [sort, setSort] = useState<{ key: SortKey | null; dir: number }>({ key: null, dir: 1 });
  const [grouped, setGrouped] = useState(false);

  const rows = [...state.plan];
  const { key, dir } = sort;
  if (key) rows.sort((a, b) => (sortValue(a, key) > sortValue(b, key) ? 1 : sortValue(a, key) < sortValue(b, key) ? -1 : 0) * dir);

  const toggleSort = (k: SortKey) => setSort((s) => ({ key: k, dir: s.key === k ? -s.dir : 1 }));
  const incomplete = state.plan.filter((w) => workstreamIssues(state, w).length > 0).length;
  const renderRow = (w: Workstream) => <PlanTableRow key={w.id} workstream={w} issues={workstreamIssues(state, w)} onOpen={onOpen} />;
  const crumb = <>Plan <span>·</span> {state.plan.length} workstreams <span>·</span> {state.plan.some(hasEstimate) ? `${formatDays(totalPlanDays(state))} entered person-days` : "Not estimated"}</>;

  return (
    <>
      <PageHeader title="Conversion Plan" crumb={crumb} savedAt={savedAt} actions={<button type="button" className="btn" onClick={onSync}>Copy findings to empty plans</button>} />
      <div className="content">
        <div className="toolbar">
          <div className="seg" role="group" aria-label="Grouping">
            <button type="button" className={!grouped ? "on" : ""} aria-pressed={!grouped} onClick={() => setGrouped(false)}>All workstreams</button>
            <button type="button" className={grouped ? "on" : ""} aria-pressed={grouped} onClick={() => setGrouped(true)}>Mandatory vs enhancement</button>
          </div>
          <span className="hint">Estimate each workstream once. Choose its action after reviewing linked findings.</span>
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
                const days = items.reduce((sum, w) => sum + effortDays(w), 0);
                return [
                  <tr className="group" key={g.scope}>
                    <td colSpan={4}>{g.label} · {items.length}</td>
                    <td className="n">{items.length && !items.some(hasEstimate) ? "—" : formatDays(days)}</td>
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

        <div className="pager">
          <span className="hint">{incomplete} workstreams still need detail or review</span>
          <button type="button" className="btn primary" onClick={() => onNavigate(SUMMARY)}>View management summary →</button>
        </div>
      </div>
    </>
  );
}

