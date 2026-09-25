import { DISCOVERY_STATUS_LABEL, DiscoveryResponseData } from "@/lib/responses";

type Props = { responses: DiscoveryResponseData[]; viewingId: string | null; onChange: (id: string) => void };

export const NO_RESPONSES_YET = "No developer has started discovery yet.";

/** Product: "Viewing: [developer ▾]" above each discovery section; answers are shown read-only. */
export default function DeveloperPicker({ responses, viewingId, onChange }: Props) {
  if (responses.length === 0) return <p className="viewing-bar hint">{NO_RESPONSES_YET}</p>;
  return (
    <div className="viewing-bar">
      <label htmlFor="viewing-developer">Viewing:</label>
      <select id="viewing-developer" value={viewingId ?? ""} onChange={(e) => onChange(e.target.value)}>
        {responses.map((r) => (
          <option key={r.id} value={r.id}>{r.developerName} — {DISCOVERY_STATUS_LABEL[r.status]}</option>
        ))}
      </select>
      <span className="hint">Answers are read-only.</span>
    </div>
  );
}
