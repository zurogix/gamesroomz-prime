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
          <span className="label">Architecture decision</span>
          <h2>Multiplayer Engine 2.0 — shared core vs separate Prime engine</h2>
          <p>
            Assess whether the existing mobile PvP engine can evolve into one player-agnostic core for both
            mobile and Prime. A separate Prime engine should be recommended only when the existing codebase
            provides concrete technical reasons that make extending or refactoring impractical.
          </p>
        </div>
        <div className="engine-principle">
          <b>Preferred direction</b>
          <span>One shared match core</span>
          <small>Validate it — do not assume it.</small>
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
          <span className="hint">These are alternatives. Only the recommended path counts toward the conversion plan.</span>
        </div>
        <div className="engine-options">
          <EngineOptionCard
            title="Shared Multiplayer Engine 2.0"
            subtitle="Refactor/extend the existing engine into a common match core with Mobile and Prime adapters."
            recommended={value.recommendedPath === "shared"}
            value={value.sharedCore}
            onChange={(patch) => onOptionChange("sharedCore", patch)}
          />
          <EngineOptionCard
            title="Separate Prime Multiplayer Engine"
            subtitle="Build and maintain a Prime-specific multiplayer implementation alongside the existing mobile engine."
            recommended={value.recommendedPath === "separate"}
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
            placeholder="Recommended if Shared Engine 2.0 is viable: (1) baseline mobile PvP and regression tests, (2) separate game state from networking, (3) generalize Players[] / PlayerId / SeatId / InputSource, (4) verify mobile behaviour, (5) add Prime multi-touch, UI and Gamesroomz adapters, (6) Prime hardware QA."
            onChange={(e) => onChange({ migrationPlan: e.target.value })}
          />
        </label>
      </div>

      {issues.length > 0 && (
        <div className="engine-issues">
          <b>Architecture assessment still needs:</b>
          <ul>{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>
        </div>
      )}
    </section>
  );
}
