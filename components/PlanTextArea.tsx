import { Workstream } from "@/lib/types";

type TextKey =
  | "currentImplementation"
  | "primeRequirement"
  | "deliverable"
  | "whyChange"
  | "proposedImplementation"
  | "reusedComponents"
  | "changedComponents"
  | "dependencies";

export type PlanTextField = { key: TextKey; label: string; placeholder?: string; large?: boolean };

type Props = {
  field: PlanTextField;
  workstream: Workstream;
  onChange: (patch: Partial<Workstream>) => void;
};

export default function PlanTextArea({ field, workstream, onChange }: Props) {
  return (
    <div className="field">
      <label htmlFor={`w-${field.key}`}>{field.label}</label>
      <textarea
        id={`w-${field.key}`}
        className={field.large ? "large" : ""}
        placeholder={field.placeholder}
        value={workstream[field.key]}
        onChange={(e) => onChange({ [field.key]: e.target.value })}
      />
    </div>
  );
}
