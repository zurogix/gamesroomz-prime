import { MultiplayerEngineAssessment } from "@/lib/types";

type Props = {
  value: MultiplayerEngineAssessment;
  onChange: (patch: Partial<MultiplayerEngineAssessment>) => void;
};

export default function EngineRewriteEvidence({ value, onChange }: Props) {
  const needsReason = !value.rewriteReason.trim();
  const needsReuse = !value.reusableComponents.trim();

  return (
    <div className="engine-replace">
      <div className="grid-2">
        <label className="field">
          <span>What in the current code leads to this recommendation? <em>required</em></span>
          <textarea
            className={needsReason ? "warn" : ""}
            value={value.rewriteReason}
            placeholder="Refer to specific classes or behaviour, e.g. how game state, networking and player ownership are connected today."
            onChange={(e) => onChange({ rewriteReason: e.target.value })}
          />
        </label>
        <label className="field">
          <span>What existing components will still be reused? <em>required</em></span>
          <textarea
            className={needsReuse ? "warn" : ""}
            value={value.reusableComponents}
            placeholder="Core bubble logic, scoring, attack rules, assets, VFX/audio, level content, backend schemas, etc."
            onChange={(e) => onChange({ reusableComponents: e.target.value })}
          />
        </label>
      </div>
    </div>
  );
}
