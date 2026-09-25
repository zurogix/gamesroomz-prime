import { BASIS_OPTIONS, needsConfirmation } from "@/lib/discoveryAnswers";
import { QuestionAnswer } from "@/lib/discoveryTypes";

type Props = {
  id: string;
  answer: QuestionAnswer;
  onChange: (patch: Partial<QuestionAnswer>) => void;
};

export default function BasisField({ id, answer, onChange }: Props) {
  const titleId = `${id}-basis`;
  return (
    <div className="field basis">
      <span className="field-title" id={titleId}>Basis for this answer</span>
      <div className="choice-options single compact" role="group" aria-labelledby={titleId}>
        {BASIS_OPTIONS.map((b) => (
          <button
            key={b.value}
            type="button"
            className={answer.basis === b.value ? "on" : ""}
            aria-pressed={answer.basis === b.value}
            onClick={() => onChange({ basis: answer.basis === b.value ? "" : b.value })}
          >
            {b.label}
          </button>
        ))}
      </div>
      {needsConfirmation(answer) && (
        <div className="field">
          <label htmlFor={`${id}-confirm`}>How could this be checked?</label>
          <input
            type="text"
            id={`${id}-confirm`}
            placeholder="e.g. search the code for X, or try Y in the editor"
            value={answer.confirmBy}
            onChange={(e) => onChange({ confirmBy: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
