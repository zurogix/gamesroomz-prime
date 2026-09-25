import { NOT_SURE_NOTE_LABEL } from "@/lib/discoveryAnswers";

type Props = { id: string; value: string; onChange: (value: string) => void };

/** Shown instead of the basis when a choice answer is "Not sure". */
export default function NotSureNoteField({ id, value, onChange }: Props) {
  return (
    <div className="field">
      <label htmlFor={`${id}-checking`}>{NOT_SURE_NOTE_LABEL}</label>
      <input type="text" id={`${id}-checking`} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
