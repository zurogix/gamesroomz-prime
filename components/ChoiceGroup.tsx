import { OTHER_ID, toggleOption, withAutoOptions } from "@/lib/discoveryAnswers";
import { ChoiceAnswer, ChoiceMode, ChoiceOption } from "@/lib/discoveryTypes";

type Props = {
  id: string;
  options: ChoiceOption[];
  mode: ChoiceMode;
  value: ChoiceAnswer;
  labelledBy: string;
  onChange: (value: ChoiceAnswer) => void;
};

export default function ChoiceGroup({ id, options, mode, value, labelledBy, onChange }: Props) {
  const all = withAutoOptions(options);
  const otherSelected = value.selected.includes(OTHER_ID);
  const toggle = (optionId: string) => onChange({ ...value, selected: toggleOption(value.selected, optionId, all, mode) });

  return (
    <div className="choice">
      <div className={`choice-options ${mode}`} role="group" aria-labelledby={labelledBy}>
        {all.map((o) => {
          const on = value.selected.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              className={`${on ? "on" : ""} ${o.exclusive ? "exclusive" : ""}`}
              aria-pressed={on}
              onClick={() => toggle(o.id)}
            >
              {mode === "multi" && <span className="tick" aria-hidden="true">{on ? "✓" : ""}</span>}
              {o.label}
            </button>
          );
        })}
      </div>
      {mode === "multi" && <span className="hint">Choose one or more.</span>}
      {otherSelected && (
        <input
          type="text"
          id={`${id}-other`}
          className="choice-other"
          aria-label="Other — please describe"
          placeholder="Other — please describe"
          value={value.other}
          onChange={(e) => onChange({ ...value, other: e.target.value })}
        />
      )}
    </div>
  );
}
