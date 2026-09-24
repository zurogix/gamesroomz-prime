import { CLASS_HELP, CLASS_LABEL, ENGINE_CLASSES } from "@/lib/sections";
import { Classification } from "@/lib/types";

type Props = {
  value: Classification;
  onChange: (value: Classification) => void;
};

export default function EngineClassificationPicker({ value, onChange }: Props) {
  return (
    <div className="engine-block">
      <span className="label" id="engine-class-title">1 · What happens to the existing multiplayer engine?</span>
      <div className="engine-strategies" role="group" aria-labelledby="engine-class-title">
        {ENGINE_CLASSES.map((c) => (
          <button
            key={c}
            type="button"
            className={value === c ? "on" : ""}
            aria-pressed={value === c}
            onClick={() => onChange(value === c ? "" : c)}
          >
            <b>{CLASS_LABEL[c]}</b>
            <small>{CLASS_HELP[c]}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
