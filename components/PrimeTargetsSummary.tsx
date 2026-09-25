import { describeCodebase, describeModes, isLink, PRIME_TARGET_FIELDS } from "@/lib/primeTargets";
import { PrimeTargets } from "@/lib/types";

type Props = { targets: PrimeTargets; onEdit: () => void };

/** Compact, read-only view of the product team's targets for developers filling in discovery. */
export default function PrimeTargetsSummary({ targets, onEdit }: Props) {
  const filled = PRIME_TARGET_FIELDS.filter((f) => targets[f.key].trim());
  const modes = describeModes(targets);
  const codebase = describeCodebase(targets.codebase);
  const empty = filled.length === 0 && modes.length === 0 && !codebase;

  return (
    <section className="targets-summary" aria-label="Prime targets">
      <div className="targets-summary-head">
        <span className="label">Prime targets — confirmed by the product team</span>
        <button type="button" className="btn quiet" onClick={onEdit}>{empty ? "Add targets" : "View on Overview"}</button>
      </div>
      {empty ? (
        <p className="hint">No targets recorded yet.</p>
      ) : (
        <dl className="targets-grid">
          {filled.map((f) => (
            <div key={f.key}>
              <dt>{f.label}</dt>
              <dd>
                {targets[f.key]}
                {f.key === "layout" && isLink(targets.layoutSketch) && (
                  <> · <a href={targets.layoutSketch.trim()} target="_blank" rel="noreferrer">sketch</a></>
                )}
              </dd>
            </div>
          ))}
          {codebase && <div><dt>Mobile codebase</dt><dd>{codebase}</dd></div>}
          {modes.length > 0 && <div><dt>First-release modes</dt><dd>{modes.join(" · ")}</dd></div>}
        </dl>
      )}
    </section>
  );
}
