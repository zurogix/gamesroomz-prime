import {
  CODEBASE_OPTIONS,
  CODEBASE_QUESTION,
  FIRST_RELEASE_FIELD,
  MODE_OPTIONS,
  MODES_QUESTION,
  OTHER_MODE,
  TECHNICAL_TARGET_FIELDS,
} from "@/lib/primeTargets";
import { PrimeTargets } from "@/lib/types";
import PrimeTargetField from "./targets/PrimeTargetField";

type Props = {
  targets: PrimeTargets;
  onChange: (patch: Partial<PrimeTargets>) => void;
};

/** The product team's editor for the Prime targets. Developers see PrimeTargetsSummary instead. */
export default function PrimeTargetsCard({ targets, onChange }: Props) {
  const toggleMode = (mode: string) =>
    onChange({ modes: targets.modes.includes(mode) ? targets.modes.filter((m) => m !== mode) : [...targets.modes, mode] });

  return (
    <section className="card">
      <h2>Prime targets — confirmed by the product team</h2>
      <div className="plain-fieldset">
        <div className="field">
          <span className="field-title" id="pt-codebase">{CODEBASE_QUESTION}</span>
          <div className="choice-options single" role="group" aria-labelledby="pt-codebase">
            {CODEBASE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                className={targets.codebase === o.value ? "on" : ""}
                aria-pressed={targets.codebase === o.value}
                onClick={() => onChange({ codebase: targets.codebase === o.value ? "" : o.value })}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field-title" id="pt-modes">{MODES_QUESTION}</span>
          <div className="choice-options multi" role="group" aria-labelledby="pt-modes">
            {MODE_OPTIONS.map((o) => {
              const on = targets.modes.includes(o.value);
              return (
                <button key={o.value} type="button" className={on ? "on" : ""} aria-pressed={on} onClick={() => toggleMode(o.value)}>
                  <span className="tick" aria-hidden="true">{on ? "✓" : ""}</span>
                  {o.label}
                </button>
              );
            })}
          </div>
          {targets.modes.includes(OTHER_MODE) && (
            <input
              type="text"
              id="pt-modes-other"
              className="choice-other"
              aria-label="Other multiplayer mode"
              placeholder="Other — please describe"
              value={targets.modesOther}
              onChange={(e) => onChange({ modesOther: e.target.value })}
            />
          )}
        </div>

        <PrimeTargetField field={FIRST_RELEASE_FIELD} value={targets.firstRelease} onChange={(firstRelease) => onChange({ firstRelease })} />

        <span className="label">Technical targets</span>
        <div className="form-grid">
          {TECHNICAL_TARGET_FIELDS.map((f) => (
            <PrimeTargetField key={f.key} field={f} value={targets[f.key]} onChange={(value) => onChange({ [f.key]: value })} />
          ))}
        </div>
      </div>
    </section>
  );
}
