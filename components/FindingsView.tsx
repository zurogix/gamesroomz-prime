import { ReactNode } from "react";
import { engineAssessmentIssues } from "@/lib/assessment";
import { EngineOptionEstimate, MultiplayerEngineAssessment } from "@/lib/types";
import MultiplayerEnginePanel from "./MultiplayerEnginePanel";
import PageHeader from "./PageHeader";

type Props = {
  engine: MultiplayerEngineAssessment;
  isProduct: boolean;
  canEditEngine: boolean;
  onEngineChange: (patch: Partial<MultiplayerEngineAssessment>) => void;
  onEngineOptionChange: (option: "sharedCore" | "separatePrime", patch: Partial<EngineOptionEstimate>) => void;
  stageActions?: ReactNode;
};

/** Stage 2: findings from discovery (to come) and the Multiplayer Engine 2.0 comparison. */
export default function FindingsView({ engine, isProduct, canEditEngine, onEngineChange, onEngineOptionChange, stageActions }: Props) {
  return (
    <>
      <PageHeader title="Findings & Options" crumb={<>Stage 2 of 4 <span>·</span> Product publishes, developer responds</>} actions={stageActions} />
      <div className="content">
        <section className="card">
          <h2>Findings</h2>
          <p className="hint">{isProduct ? "Findings from the discovery answers will be added here." : "Findings will appear here."}</p>
        </section>

        <fieldset className="plain-fieldset" disabled={!canEditEngine}>
          <MultiplayerEnginePanel value={engine} issues={engineAssessmentIssues(engine)} onChange={onEngineChange} onOptionChange={onEngineOptionChange} />
        </fieldset>
        {!canEditEngine && <p className="hint">The engine comparison can be edited while findings or the plan are open.</p>}
      </div>
    </>
  );
}
