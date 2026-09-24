import { engineOptionTotal } from "@/lib/assessment";
import { formatDays, RECOMMENDED_PATH_LABEL } from "@/lib/sections";
import { MultiplayerEngineAssessment, RecommendedPath } from "@/lib/types";

type Props = {
  value: MultiplayerEngineAssessment;
  onChange: (patch: Partial<MultiplayerEngineAssessment>) => void;
};

const PATHS: Exclude<RecommendedPath, "">[] = ["shared", "separate"];

export default function EnginePathChoice({ value, onChange }: Props) {
  const daysFor = (path: Exclude<RecommendedPath, "">) =>
    engineOptionTotal(path === "shared" ? value.sharedCore : value.separatePrime);
  const needsJustification = Boolean(value.recommendedPath) && !value.pathJustification.trim();

  return (
    <div className="engine-block">
      <span className="label" id="engine-path-title">3 · Which path do you recommend?</span>
      <div className="engine-strategies engine-paths" role="group" aria-labelledby="engine-path-title">
        {PATHS.map((path) => (
          <button
            key={path}
            type="button"
            className={value.recommendedPath === path ? "on" : ""}
            aria-pressed={value.recommendedPath === path}
            onClick={() => onChange({ recommendedPath: value.recommendedPath === path ? "" : path })}
          >
            <b>{RECOMMENDED_PATH_LABEL[path]}</b>
            <small>{formatDays(daysFor(path))} person-days · counts toward the conversion plan when selected</small>
          </button>
        ))}
      </div>
      <label className="field engine-justification">
        <span>Why this path over the other? Refer to the cost, risk and maintenance comparison. <em>required</em></span>
        <textarea
          className={needsJustification ? "warn" : ""}
          value={value.pathJustification}
          placeholder="Compare initial effort, technical risk and long-term maintenance of both paths."
          onChange={(e) => onChange({ pathJustification: e.target.value })}
        />
      </label>
    </div>
  );
}
