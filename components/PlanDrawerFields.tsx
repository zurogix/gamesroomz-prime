import { ENGINE_WORKSTREAM_ID } from "@/lib/engine";
import { MultiplayerEngineAssessment, Risk, ScopeType, Workstream } from "@/lib/types";
import type { DrawerTab } from "./PlanDrawer";
import EngineWorkstreamFacts from "./EngineWorkstreamFacts";
import HelpMeChoose from "./HelpMeChoose";
import ImpactButtons from "./ImpactButtons";
import PlanTextArea, { PlanTextField } from "./PlanTextArea";

type Props = {
  workstream: Workstream;
  engine: MultiplayerEngineAssessment;
  tab: DrawerTab;
  onChange: (patch: Partial<Workstream>) => void;
};

const TEXT_FIELDS: Record<Exclude<DrawerTab, "effort">, PlanTextField[]> = {
  overview: [
    { key: "currentImplementation", label: "Current implementation" },
    { key: "primeRequirement", label: "Prime requirement" },
    { key: "deliverable", label: "Deliverable / acceptance outcome" },
  ],
  impl: [
    { key: "whyChange", label: "Why is this change required?", placeholder: "Give the technical reason. Avoid simply saying “redo”." },
    { key: "proposedImplementation", label: "Proposed implementation", placeholder: "Architecture and implementation steps, and how the Prime requirement will be achieved.", large: true },
  ],
  comp: [
    { key: "reusedComponents", label: "Existing components to reuse" },
    { key: "changedComponents", label: "Components changed / removed / rebuilt" },
  ],
};

export default function PlanDrawerFields({ workstream: w, engine, tab, onChange }: Props) {
  if (tab !== "effort") {
    return <>{TEXT_FIELDS[tab].map((f) => <PlanTextArea key={f.key} field={f} workstream={w} onChange={onChange} />)}</>;
  }

  const isEngine = w.id === ENGINE_WORKSTREAM_ID;

  return (
    <>
      <div className="field">
        <span className="field-title" id="w-class">Classification</span>
        <div className="impact-row">
          <ImpactButtons value={w.classification} labelledBy="w-class" onChange={(classification) => onChange({ classification })} />
          <HelpMeChoose />
        </div>
      </div>
      {isEngine && <EngineWorkstreamFacts workstream={w} engine={engine} />}
      <div className={isEngine ? "row-3 row-1" : "row-3"}>
        <div className="field">
          <label htmlFor="w-scope">Scope</label>
          <select id="w-scope" value={w.scopeType} onChange={(e) => onChange({ scopeType: e.target.value as ScopeType })}>
            <option value="mandatory">Mandatory</option>
            <option value="enhancement">Enhancement</option>
          </select>
        </div>
        {!isEngine && <div className="field">
          <label htmlFor="w-risk">Technical risk</label>
          <select id="w-risk" value={w.risk} onChange={(e) => onChange({ risk: e.target.value as Risk })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>}
        {!isEngine && <div className="field">
          <label htmlFor="w-days">Person-days</label>
          <input type="number" id="w-days" min="0" step="0.5" value={w.personDays || ""} onChange={(e) => onChange({ personDays: Number(e.target.value) || 0 })} />
        </div>}
      </div>
      <PlanTextArea field={{ key: "dependencies", label: "Dependencies / assumptions" }} workstream={w} onChange={onChange} />
    </>
  );
}
