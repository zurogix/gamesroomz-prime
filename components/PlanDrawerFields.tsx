import { Risk, ScopeType, Workstream } from "@/lib/types";
import type { DrawerTab } from "./PlanDrawer";
import ImpactButtons from "./ImpactButtons";
import PlanTextArea from "./PlanTextArea";
type Props = {
  workstream: Workstream;
  tab: DrawerTab;
  onChange: (patch: Partial<Workstream>) => void;
};
export default function PlanDrawerFields({
  workstream: w,
  tab,
  onChange,
}: Props) {
  if (tab === "detail")
    return (
      <>
        <PlanTextArea
          field={{
            key: "currentImplementation",
            label: "Current implementation / code references",
          }}
          workstream={w}
          onChange={onChange}
        />
        <PlanTextArea
          field={{
            key: "reusedComponents",
            label: "Existing components to reuse",
          }}
          workstream={w}
          onChange={onChange}
        />
        <PlanTextArea
          field={{
            key: "changedComponents",
            label: "Components changed / removed / rebuilt",
          }}
          workstream={w}
          onChange={onChange}
        />
      </>
    );
  return (
    <>
      <div className="field">
        <span className="field-title" id="w-class">
          Workstream action
        </span>
        <ImpactButtons
          value={w.classification}
          labelledBy="w-class"
          onChange={(classification) => onChange({ classification })}
        />
      </div>
      <PlanTextArea
        field={{
          key: "whyChange",
          label:
            w.classification === "na"
              ? "Why is this outside scope?"
              : "Finding / reason for this action",
          placeholder:
            "Name the affected component and evidence. For Reuse, explain what was verified. Avoid a general “redo”.",
        }}
        workstream={w}
        onChange={onChange}
      />
      {w.classification !== "na" && (
        <>
          <PlanTextArea
            field={{
              key: "proposedImplementation",
              label: "Required work / verification",
              placeholder:
                "List concrete implementation and verification tasks. For mixed work, say what is reused, modified, rewritten or added.",
              large: true,
            }}
            workstream={w}
            onChange={onChange}
          />
          <PlanTextArea
            field={{ key: "deliverable", label: "Acceptance outcome" }}
            workstream={w}
            onChange={onChange}
          />
          <div className="row-3">
            <div className="field">
              <label htmlFor="w-scope">Scope</label>
              <select
                id="w-scope"
                value={w.scopeType}
                onChange={(e) =>
                  onChange({ scopeType: e.target.value as ScopeType })
                }
              >
                <option value="mandatory">Mandatory</option>
                <option value="enhancement">Optional enhancement</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="w-risk">Technical risk</label>
              <select
                id="w-risk"
                value={w.risk}
                onChange={(e) => onChange({ risk: e.target.value as Risk })}
              >
                <option value="">Not assessed</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="w-days">Person-days</label>
              <input
                type="number"
                id="w-days"
                min="0"
                step="0.5"
                placeholder="Not estimated"
                value={w.personDays ?? ""}
                onChange={(e) =>
                  onChange({
                    personDays:
                      e.target.value === ""
                        ? null
                        : Math.max(0, Number(e.target.value)),
                  })
                }
              />
            </div>
          </div>
          <p className="hint">
            Count each task once, including developer testing. Put shared system
            testing in QA. Zero is valid for verified reuse; required changes
            need a positive estimate.
          </p>
          <PlanTextArea
            field={{
              key: "dependencies",
              label: "Dependencies / estimate assumptions",
              placeholder:
                "State dependencies, testing allowance and exclusions. Enter None if verified. Person-days are effort, not elapsed delivery time.",
            }}
            workstream={w}
            onChange={onChange}
          />
        </>
      )}
      <label className="review-check">
        <input
          type="checkbox"
          checked={w.reviewed}
          onChange={(e) => onChange({ reviewed: e.target.checked })}
        />{" "}
        I reviewed this plan against the linked findings and counted its effort
        once.
      </label>
    </>
  );
}
