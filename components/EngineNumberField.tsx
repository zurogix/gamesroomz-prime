type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

export default function EngineNumberField({ label, value, onChange }: Props) {
  return (
    <label className="engine-num">
      <span>{label}</span>
      <div>
        <input
          type="number"
          min="0"
          step="0.5"
          value={value || ""}
          placeholder="0"
          onChange={(e) => onChange(Number(e.target.value) || 0)}
        />
        <small>d</small>
      </div>
    </label>
  );
}
