import { engineOptionTotal } from "@/lib/assessment";
import { formatDays } from "@/lib/sections";
import { EngineOptionEstimate } from "@/lib/types";

type Props = { title: string; option: EngineOptionEstimate; recommended: boolean };

export default function EngineOptionSummary({ title, option, recommended }: Props) {
  return (
    <div>
      <span className="label">{title}{recommended ? " · Recommended" : ""}</span>
      <b className="num">{formatDays(engineOptionTotal(option))} d</b>
      <small>Shared code: {option.sharedCode || "—"} · Risk: {option.risk}</small>
      <p>{option.maintenanceImpact || "Maintenance impact not documented yet."}</p>
    </div>
  );
}
