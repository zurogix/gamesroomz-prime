"use client";

import { EngineOptionEstimate, MultiplayerEngineAssessment } from "@/lib/types";
import EngineClassificationPicker from "./EngineClassificationPicker";
import EngineOptionCard from "./EngineOptionCard";
import EnginePathChoice from "./EnginePathChoice";
import EngineRewriteEvidence from "./EngineRewriteEvidence";

type Props = {
  value: MultiplayerEngineAssessment;
  issues: string[];
  onChange: (patch: Partial<MultiplayerEngineAssessment>) => void;
  onOptionChange: (option: "sharedCore" | "separatePrime", patch: Partial<EngineOptionEstimate>) => void;
};

export default function MultiplayerEnginePanel({ value, issues, onChange, onOptionChange }: Props) {
  return (
    <section className="engine-panel">
      <div className="engine-intro">
        <div>
          <span className="label">Architecture options</span>
          <h2>Multiplayer Engine 2.0 — shared core or separate Prime engine</h2>
          <p>Compare both paths on effort, risk and long-term maintenance, and record the recommended path with its reasons.</p>
        </div>
      </div>

      <EngineClassificationPicker value={value.engineClassification} onChange={(engineClassification) => onChange({ engineClassification })} />

      <div className="engine-block grid-2">
        <label className="field">
          <span>Current networking framework <em>required</em></span>
          <input
            value={value.networkingFramework}
            placeholder="e.g. Photon PUN/Fusion, Mirror, Netcode for GameObjects, custom"
            onChange={(e) => onChange({ networkingFramework: e.target.value })}
          />
        </label>
        <label className="field">
          <span>Current state / latency model <em>required</em></span>
          <input
            value={value.stateUpdateModel}
            placeholder="e.g. event sync, server authoritative, prediction/reconciliation, rollback"
            onChange={(e) => onChange({ stateUpdateModel: e.target.value })}
          />
        </label>
      </div>

      {value.engineClassification === "rewrite" && <EngineRewriteEvidence value={value} onChange={onChange} />}

      <div className="engine-block">
        <div className="engine-compare-head">
          <div>
            <span className="label">2 · Cost both architecture paths</span>
            <h3>Compare initial effort and ongoing maintenance</h3>
          </div>
          <span className="hint">These are alternatives. Only the recommended path counts toward the plan total.</span>
        </div>
        <div className="engine-options">
          <EngineOptionCard
            title="Shared Multiplayer Engine 2.0"
            subtitle="Refactor/extend the existing engine into a common match core with Mobile and Prime adapters."
            value={value.sharedCore}
            onChange={(patch) => onOptionChange("sharedCore", patch)}
          />
          <EngineOptionCard
            title="Separate Prime Multiplayer Engine"
            subtitle="Build and maintain a Prime-specific multiplayer implementation alongside the existing mobile engine."
            value={value.separatePrime}
            onChange={(patch) => onOptionChange("separatePrime", patch)}
          />
        </div>
      </div>

      <EnginePathChoice value={value} onChange={onChange} />

      <div className="engine-block">
        <label className="field">
          <span>4 · Proposed migration / implementation sequence</span>
          <textarea
            className="engine-plan-text"
            value={value.migrationPlan}
            placeholder="Outline the steps for the recommended path, e.g. baseline mobile behaviour and tests, the main code changes in order, how mobile keeps working, Prime adapters, and hardware QA."
            onChange={(e) => onChange({ migrationPlan: e.target.value })}
          />
        </label>
      </div>

      {issues.length > 0 && (
        <div className="engine-issues">
          <b>Still to record:</b>
          <ul>{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>
        </div>
      )}
    </section>
  );
}
