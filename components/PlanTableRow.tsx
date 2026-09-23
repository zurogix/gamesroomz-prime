import { planFieldsDone, PLAN_FIELD_COUNT } from "@/lib/assessment";
import { formatDays } from "@/lib/sections";
import { Workstream } from "@/lib/types";
import ClassificationChip from "./ClassificationChip";
import RiskLabel from "./RiskLabel";

type Props = { workstream: Workstream; onOpen: (id: string) => void };

export default function PlanTableRow({ workstream: w, onOpen }: Props) {
  const done = planFieldsDone(w);
  return (
    <tr
      tabIndex={0}
      onClick={() => onOpen(w.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen(w.id);
      }}
    >
      <td className="ws">
        <b>{w.title}</b>
        <small>{w.deliverable}</small>
      </td>
      <td><ClassificationChip value={w.classification} /></td>
      <td><RiskLabel risk={w.risk} /></td>
      <td>{w.scopeType === "mandatory" ? "Mandatory" : "Enhancement"}</td>
      <td className="n">{formatDays(w.personDays)}</td>
      <td>
        <span className="done-bar">
          <span className="bar"><i style={{ width: `${(done / PLAN_FIELD_COUNT) * 100}%` }} /></span>
          {done}/{PLAN_FIELD_COUNT}
        </span>
      </td>
    </tr>
  );
}
