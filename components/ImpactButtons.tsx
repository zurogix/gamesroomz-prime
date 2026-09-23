import { CLASSES, CLASS_HELP, CLASS_LABEL, ImpactClass } from "@/lib/sections";
import { Classification } from "@/lib/types";

type Props = {
  value: Classification;
  onChange: (value: Classification) => void;
  labelledBy?: string;
};

export default function ImpactButtons({ value, onChange, labelledBy }: Props) {
  const toggle = (c: ImpactClass) => onChange(value === c ? "" : c);
  return (
    <div className="impact" role="group" aria-labelledby={labelledBy}>
      {CLASSES.map((c) => (
        <button
          key={c}
          type="button"
          className={`${c} ${value === c ? "on" : ""}`}
          aria-pressed={value === c}
          title={CLASS_HELP[c]}
          onClick={() => toggle(c)}
        >
          {CLASS_LABEL[c]}
        </button>
      ))}
    </div>
  );
}
