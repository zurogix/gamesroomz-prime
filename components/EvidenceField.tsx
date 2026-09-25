import { Evidence } from "@/lib/discoveryTypes";

type Props = {
  id: string;
  evidence: Evidence;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
};

export default function EvidenceField({ id, evidence, hint, value, onChange }: Props) {
  if (evidence === "none") return null;
  const showSoftHint = evidence === "recommended" && !value.trim();

  return (
    <div className="field">
      <label htmlFor={`${id}-evidence`}>Relevant class/file, test, or brief example (one is enough)</label>
      <input type="text" id={`${id}-evidence`} placeholder={hint ? `e.g. ${hint}` : ""} value={value} onChange={(e) => onChange(e.target.value)} />
      {showSoftHint && <span className="hint">A reference here helps the team follow up{hint ? ` — ${hint.toLowerCase()}` : ""}.</span>}
    </div>
  );
}
