import { formatDays } from "@/lib/sections";
import { MultiplayerEngineAssessment, Workstream } from "@/lib/types";

type Props = { workstream: Workstream; engine: MultiplayerEngineAssessment };

/** Read-only Engine 2.0 values that come from the Multiplayer Engine 2.0 comparison. */
export default function EngineWorkstreamFacts({ workstream, engine }: Props) {
  return (
    <dl className="facts readonly-facts">
      <dt>Person-days</dt>
      <dd>
        <span className="num">{formatDays(workstream.personDays)}</span>
        <small className="hint"> From Multiplayer Engine 2.0 comparison</small>
      </dd>
      <dt>Technical risk</dt>
      <dd className="cap">{workstream.risk}</dd>
      <dt>Networking framework</dt>
      <dd>{engine.networkingFramework.trim() || "Not documented"}</dd>
      <dt>State / update model</dt>
      <dd>{engine.stateUpdateModel.trim() || "Not documented"}</dd>
    </dl>
  );
}
