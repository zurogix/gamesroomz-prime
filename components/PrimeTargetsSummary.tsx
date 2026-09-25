import { describeCodebase, describeModes, describeTarget, isLink, TEXT_TARGET_FIELDS } from "@/lib/primeTargets";
import { PrimeTargets } from "@/lib/types";

type Props = {
  targets: PrimeTargets;
  /** Shown as a button in the header when given (e.g. "View on Overview"). */
  action?: { label: string; onClick: () => void };
};

/** Compact, read-only view of the product team's targets. Undecided targets show their label, not a blank. */
export default function PrimeTargetsSummary({ targets, action }: Props) {
  const recorded = TEXT_TARGET_FIELDS.map((f) => ({ field: f, text: describeTarget(targets[f.key]) })).filter((r) => r.text);
  const modes = describeModes(targets);
  const codebase = describeCodebase(targets.codebase);
  const empty = recorded.length === 0 && modes.length === 0 && !codebase;
  const sketch = targets.layout.state === "set" && isLink(targets.layout.link ?? "") ? targets.layout.link!.trim() : "";

  return (
    <section className="targets-summary" aria-label="Prime targets">
      <div className="targets-summary-head">
        <span className="label">Prime targets — confirmed by the product team</span>
        {action && <button type="button" className="btn quiet" onClick={action.onClick}>{action.label}</button>}
      </div>
      {empty ? (
        <p className="hint">No targets recorded yet.</p>
      ) : (
        <dl className="targets-grid">
          {codebase && <div><dt>Mobile codebase</dt><dd>{codebase}</dd></div>}
          {modes.length > 0 && <div><dt>First-release modes</dt><dd>{modes.join(" · ")}</dd></div>}
          {recorded.map(({ field, text }) => (
            <div key={field.key}>
              <dt>{field.label}</dt>
              <dd>
                {text}
                {field.key === "layout" && sketch && <> · <a href={sketch} target="_blank" rel="noreferrer">sketch</a></>}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
