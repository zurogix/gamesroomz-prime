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
      <div className="engine-warning">
        <b>Rewrite requires technical evidence.</b>
        <span>
          “Prime multiplayer is different” is not sufficient. Document why Extend/Refactor cannot reasonably work,
          and identify what still survives from the existing game.
        </span>
      </div>
      <div className="grid-2">
        <label className="field">
          <span>Why can the current engine not be extended/refactored? <em>required</em></span>
          <textarea
            className={needsReason ? "warn" : ""}
            value={value.rewriteReason}
            placeholder="Examples: pervasive NetworkBehaviour/RPC coupling, obsolete framework, game state inseparable from transport, unacceptable mobile regression risk."
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
