import { targetStateOptions, TextTargetField } from "@/lib/primeTargets";
import { TargetValue } from "@/lib/types";

type Props = {
  field: TextTargetField;
  value: TargetValue;
  onChange: (value: TargetValue) => void;
};

/** A text target: pick Set / Not decided yet (/ To be agreed with developer); the text shows only when Set. */
export default function PrimeTargetField({ field, value, onChange }: Props) {
  const inputId = `pt-${field.key}`;
  const titleId = `${inputId}-title`;
  const multiline = field.key === "firstRelease";

  return (
    <div className="field target-field">
      <span className="field-title" id={titleId}>{field.label}</span>
      <div className="seg" role="group" aria-labelledby={titleId}>
        {targetStateOptions(field).map((o) => (
          <button
            key={o.value}
            type="button"
            className={value.state === o.value ? "on" : ""}
            aria-pressed={value.state === o.value}
            onClick={() => onChange({ ...value, state: value.state === o.value ? "" : o.value })}
          >
            {o.label}
          </button>
        ))}
      </div>
      {value.state === "set" && (multiline ? (
        <textarea id={inputId} aria-labelledby={titleId} value={value.value} placeholder={field.placeholder} onChange={(e) => onChange({ ...value, value: e.target.value })} />
      ) : (
        <input type="text" id={inputId} aria-labelledby={titleId} value={value.value} placeholder={field.placeholder} onChange={(e) => onChange({ ...value, value: e.target.value })} />
      ))}
      {value.state === "set" && field.key === "layout" && (
        <div className="field target-link">
          <label htmlFor="pt-layout-link">Sketch link (optional)</label>
          <input type="url" id="pt-layout-link" placeholder="https://" value={value.link ?? ""} onChange={(e) => onChange({ ...value, link: e.target.value })} />
        </div>
      )}
    </div>
  );
}
