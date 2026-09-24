"use client";

import { engineOptionTotal } from "@/lib/assessment";
import {
  EngineOptionEstimate,
  EngineStrategy,
  MultiplayerEngineAssessment,
} from "@/lib/types";

type Props = {
  value: MultiplayerEngineAssessment;
  issues: string[];
  onChange: (patch: Partial<MultiplayerEngineAssessment>) => void;
  onOptionChange: (
    option: "sharedCore" | "separatePrime",
    patch: Partial<EngineOptionEstimate>
  ) => void;
};

const STRATEGIES: { value: Exclude<EngineStrategy, "">; label: string; help: string }[] = [
  { value: "reuse", label: "Reuse", help: "Existing engine already supports the target model with minimal structural change." },
  { value: "extend", label: "Extend", help: "Keep the current engine and add abstractions/adapters for Prime." },
  { value: "refactor", label: "Refactor", help: "Restructure the current engine into a shared player-agnostic core." },
  { value: "replace", label: "Replace", help: "Current engine cannot reasonably evolve; replace its multiplayer core with technical evidence." },
];

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="engine-num">
      <span>{label}</span>
      <div>
        <input
          type="number"
          min="0"
          step="0.5"
          value={value || ""}
          placeholder="0"
          onChange={(e) => onChange(Number(e.target.value) || 0)}
        />
        <small>d</small>
      </div>
    </label>
  );
}

function OptionCard({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  value: EngineOptionEstimate;
  onChange: (patch: Partial<EngineOptionEstimate>) => void;
}) {
  const total = engineOptionTotal(value);
  return (
    <section className="engine-option">
      <div className="engine-option-head">
        <div>
          <span className="label">Architecture path</span>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <div className="engine-total"><b>{total}</b><span>person-days</span></div>
      </div>

      <div className="engine-days-grid">
        <NumberField label="Core / build" value={value.coreOrBuildDays} onChange={(v) => onChange({ coreOrBuildDays: v })} />
        <NumberField label="Mobile regression" value={value.mobileRegressionDays} onChange={(v) => onChange({ mobileRegressionDays: v })} />
        <NumberField label="Prime integration" value={value.primeIntegrationDays} onChange={(v) => onChange({ primeIntegrationDays: v })} />
        <NumberField label="QA / stabilization" value={value.qaDays} onChange={(v) => onChange({ qaDays: v })} />
      </div>

      <div className="engine-selects">
        <label className="field">
          <span>Shared code level</span>
          <select value={value.sharedCode} onChange={(e) => onChange({ sharedCode: e.target.value as EngineOptionEstimate["sharedCode"] })}>
            <option value="">Select…</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label className="field">
          <span>Technical risk</span>
          <select value={value.risk} onChange={(e) => onChange({ risk: e.target.value as EngineOptionEstimate["risk"] })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
      </div>

      <label className="field">
        <span>Ongoing maintenance impact</span>
        <textarea
          value={value.maintenanceImpact}
          placeholder="Describe what must be maintained long-term, duplicated fixes/features, and expected maintenance burden."
          onChange={(e) => onChange({ maintenanceImpact: e.target.value })}
        />
      </label>
      <label className="field">
        <span>Assumptions / notes</span>
        <textarea
          value={value.notes}
          placeholder="Important assumptions, framework limitations, dependencies or unknowns behind this estimate."
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </label>
    </section>
  );
}

export default function MultiplayerEnginePanel({ value, issues, onChange, onOptionChange }: Props) {
  const replaceNeedsReason = value.strategy === "replace" && !value.replaceReason.trim();
  const replaceNeedsReuse = value.strategy === "replace" && !value.reusableComponents.trim();

  return (
    <section className="engine-panel">
      <div className="engine-intro">
        <div>
          <span className="label">Architecture decision</span>
          <h2>Multiplayer Engine 2.0 — shared core vs separate Prime engine</h2>
          <p>
            Assess whether the existing mobile PvP engine can evolve into one player-agnostic core for both
            mobile and Prime. A separate Prime engine should be selected only when the existing codebase
            provides concrete technical reasons that make extension or refactoring impractical.
          </p>
        </div>
        <div className="engine-principle">
          <b>Preferred direction</b>
          <span>One shared match core</span>
          <small>Validate it — do not assume it.</small>
        </div>
      </div>

      <div className="engine-block">
        <span className="label">1 · Classify the existing multiplayer engine</span>
        <div className="engine-strategies">
          {STRATEGIES.map((item) => (
            <button
              key={item.value}
              type="button"
              className={value.strategy === item.value ? "on" : ""}
              aria-pressed={value.strategy === item.value}
              onClick={() => onChange({ strategy: item.value })}
            >
              <b>{item.label}</b>
              <small>{item.help}</small>
            </button>
          ))}
        </div>
      </div>

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

      {value.strategy === "replace" && (
        <div className="engine-replace">
          <div className="engine-warning">
            <b>Replace requires technical evidence.</b>
            <span>
              “Prime multiplayer is different” is not sufficient. Document why Extend/Refactor cannot reasonably work,
              and identify what still survives from the existing game.
            </span>
          </div>
          <div className="grid-2">
            <label className="field">
              <span>Why can the current engine not be extended/refactored? <em>required</em></span>
              <textarea
                className={replaceNeedsReason ? "warn" : ""}
                value={value.replaceReason}
                placeholder="Examples: pervasive NetworkBehaviour/RPC coupling, obsolete framework, game state inseparable from transport, unacceptable mobile regression risk."
                onChange={(e) => onChange({ replaceReason: e.target.value })}
              />
            </label>
            <label className="field">
              <span>What existing components will still be reused? <em>required</em></span>
              <textarea
                className={replaceNeedsReuse ? "warn" : ""}
                value={value.reusableComponents}
                placeholder="Core bubble logic, scoring, attack rules, assets, VFX/audio, level content, backend schemas, etc."
                onChange={(e) => onChange({ reusableComponents: e.target.value })}
              />
            </label>
          </div>
        </div>
      )}

      <div className="engine-block">
        <div className="engine-compare-head">
          <div>
            <span className="label">2 · Cost both architecture paths</span>
            <h3>Compare initial effort and ongoing maintenance</h3>
          </div>
          <span className="hint">These estimates are alternatives; they are not added together in the implementation-plan total.</span>
        </div>
        <div className="engine-options">
          <OptionCard
            title="Shared Multiplayer Engine 2.0"
            subtitle="Refactor/extend the existing engine into a common match core with Mobile and Prime adapters."
            value={value.sharedCore}
            onChange={(patch) => onOptionChange("sharedCore", patch)}
          />
          <OptionCard
            title="Separate Prime Multiplayer Engine"
            subtitle="Build and maintain a Prime-specific multiplayer implementation alongside the existing mobile engine."
            value={value.separatePrime}
            onChange={(patch) => onOptionChange("separatePrime", patch)}
          />
        </div>
      </div>

      <div className="engine-block">
        <label className="field">
          <span>3 · Proposed migration / implementation sequence</span>
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
