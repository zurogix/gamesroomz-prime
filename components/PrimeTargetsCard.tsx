import {
  CODEBASE_OPTIONS,
  CODEBASE_QUESTION,
  MODE_OPTIONS,
  MODES_QUESTION,
  OTHER_MODE,
  PRIME_TARGET_FIELDS,
} from "@/lib/primeTargets";
import { PrimeTargets } from "@/lib/types";

type Props = {
  targets: PrimeTargets;
  onChange: (patch: Partial<PrimeTargets>) => void;
};

export default function PrimeTargetsCard({ targets, onChange }: Props) {
  const toggleMode = (mode: string) =>
    onChange({ modes: targets.modes.includes(mode) ? targets.modes.filter((m) => m !== mode) : [...targets.modes, mode] });

  return (
    <section className="card">
      <h2>Prime targets — confirmed by the product team</h2>
      <div className="form-grid">
        {PRIME_TARGET_FIELDS.map((f) => (
          <div className="field" key={f.key}>
            <label htmlFor={`pt-${f.key}`}>{f.label}</label>
            <input type="text" id={`pt-${f.key}`} value={targets[f.key]} onChange={(e) => onChange({ [f.key]: e.target.value })} />
          </div>
        ))}
        <div className="field">
          <label htmlFor="pt-sketch">P1/P2 layout sketch link (optional)</label>
          <input type="url" id="pt-sketch" placeholder="https://" value={targets.layoutSketch} onChange={(e) => onChange({ layoutSketch: e.target.value })} />
        </div>
      </div>

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
    </section>
  );
}
