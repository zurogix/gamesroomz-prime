import { QuestionAnswer } from "@/lib/discoveryTypes";

type Props = {
  id: string;
  answer: QuestionAnswer;
  labelledBy: string;
  onChange: (patch: Partial<QuestionAnswer>) => void;
};

export default function OpenAnswer({ id, answer, labelledBy, onChange }: Props) {
  return (
    <div className="open-answer">
      {!answer.notSureYet && (
        <textarea
          id={`${id}-text`}
          aria-labelledby={labelledBy}
          placeholder="Your answer"
          value={answer.text}
          onChange={(e) => onChange({ text: e.target.value })}
        />
      )}
      <label className="check-inline" htmlFor={`${id}-notsure`}>
        <input type="checkbox" id={`${id}-notsure`} checked={answer.notSureYet} onChange={(e) => onChange({ notSureYet: e.target.checked })} />
        Not sure yet
      </label>
      {answer.notSureYet && (
        <div className="field">
          <label htmlFor={`${id}-checking`}>What would you need to check? (optional)</label>
          <input type="text" id={`${id}-checking`} value={answer.needsChecking} onChange={(e) => onChange({ needsChecking: e.target.value })} />
        </div>
      )}
    </div>
  );
}
