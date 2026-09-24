import { engineOptionTotal } from "@/lib/assessment";
import { formatDays } from "@/lib/sections";
import { EngineOptionEstimate } from "@/lib/types";
import EngineNumberField from "./EngineNumberField";

type Props = {
  title: string;
  subtitle: string;
  recommended: boolean;
  value: EngineOptionEstimate;
  onChange: (patch: Partial<EngineOptionEstimate>) => void;
};

export default function EngineOptionCard({ title, subtitle, recommended, value, onChange }: Props) {
  return (
    <section className={`engine-option ${recommended ? "recommended" : ""}`}>
      <div className="engine-option-head">
        <div>
          <span className="label">{recommended ? "Recommended path" : "Architecture path"}</span>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <div className="engine-total"><b>{formatDays(engineOptionTotal(value))}</b><span>person-days</span></div>
      </div>

      <div className="engine-days-grid">
        <EngineNumberField label="Core / build" value={value.coreOrBuildDays} onChange={(v) => onChange({ coreOrBuildDays: v })} />
        <EngineNumberField label="Mobile regression" value={value.mobileRegressionDays} onChange={(v) => onChange({ mobileRegressionDays: v })} />
        <EngineNumberField label="Prime integration" value={value.primeIntegrationDays} onChange={(v) => onChange({ primeIntegrationDays: v })} />
        <EngineNumberField label="QA / stabilization" value={value.qaDays} onChange={(v) => onChange({ qaDays: v })} />
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
