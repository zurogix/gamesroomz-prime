import { CLASS_LABEL, RECOMMENDED_PATH_LABEL } from "@/lib/sections";
import { MultiplayerEngineAssessment } from "@/lib/types";
import EngineOptionSummary from "./EngineOptionSummary";

type Props = { engine: MultiplayerEngineAssessment };

export default function EngineSummaryCard({ engine }: Props) {
  const classification = engine.engineClassification ? CLASS_LABEL[engine.engineClassification] : "Not classified";
  const path = engine.recommendedPath ? RECOMMENDED_PATH_LABEL[engine.recommendedPath] : "No path recommended";

  return (
    <section className="card engine-summary-card">
      <div className="engine-summary-head">
        <div>
          <span className="label">Multiplayer architecture decision</span>
          <h2>Shared Engine 2.0 or separate Prime engine</h2>
        </div>
      </div>
      <dl className="engine-decision">
        <div>
          <dt>Existing multiplayer engine</dt>
          <dd><span className="engine-strategy-badge">{classification}</span></dd>
        </div>
        <div>
          <dt>Recommended path</dt>
          <dd><span className="engine-strategy-badge">{path}</span></dd>
        </div>
      </dl>
      <div className="engine-summary-justification">
        <b>Why this path</b>
        <p>{engine.pathJustification.trim() || "No reasons recorded yet."}</p>
      </div>
      <div className="engine-summary-grid">
        <EngineOptionSummary title={RECOMMENDED_PATH_LABEL.shared} option={engine.sharedCore} recommended={engine.recommendedPath === "shared"} />
        <EngineOptionSummary title={RECOMMENDED_PATH_LABEL.separate} option={engine.separatePrime} recommended={engine.recommendedPath === "separate"} />
      </div>
      <div className="engine-summary-meta">
        <span><b>Framework:</b> {engine.networkingFramework || "Not documented"}</span>
        <span><b>State/update model:</b> {engine.stateUpdateModel || "Not documented"}</span>
      </div>
      {engine.engineClassification === "rewrite" && (
        <div className="engine-summary-replace">
          <b>What in the current code leads to this recommendation</b>
          <p>{engine.rewriteReason || "Not recorded yet."}</p>
          <b>Existing components that will still be reused</b>
          <p>{engine.reusableComponents || "Not recorded yet."}</p>
        </div>
      )}
    </section>
  );
}
