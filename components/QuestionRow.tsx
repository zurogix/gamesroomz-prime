import { forwardRef } from "react";
import { ANSWERS, CLASS_HELP } from "@/lib/sections";
import { Question, QuestionResponse } from "@/lib/types";
import ImpactButtons from "./ImpactButtons";

type Props = {
  question: Question;
  number: number;
  response: QuestionResponse;
  focused: boolean;
  onFocus: () => void;
  onChange: (patch: Partial<QuestionResponse>) => void;
};
const QuestionRow = forwardRef<HTMLElement, Props>(function QuestionRow(
  { question, number, response, focused, onFocus, onChange },
  ref,
) {
  const { id } = question;
  const missingReason = Boolean(
    response.classification && !response.explanation.trim(),
  );
  return (
    <article
      ref={ref}
      className={`q ${focused ? "focus" : ""}`}
      onClick={onFocus}
      onFocus={onFocus}
    >
      <div className="q-text">
        <span className="q-num">{number}.</span>
        <div>
          <p>{question.prompt}</p>
          <small>{question.helper}</small>
        </div>
      </div>
      <div className="question-outcomes">
        <div className="ctl">
          <span className="ctl-title" id={`il-${id}`}>
            Required action
          </span>
          <ImpactButtons
            value={response.classification}
            labelledBy={`il-${id}`}
            onChange={(classification) =>
              onChange({ classification, answer: classification ? "yes" : "" })
            }
          />
        </div>
        <div className="seg" role="group" aria-label="Unresolved requirement">
          {ANSWERS.map((a) => (
            <button
              key={a.value}
              type="button"
              className={response.answer === a.value ? "on" : ""}
              aria-pressed={response.answer === a.value}
              onClick={() =>
                onChange({
                  classification: "",
                  answer: response.answer === a.value ? "" : a.value,
                })
              }
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
      <div className="q-detail field">
        <label htmlFor={`ex-${id}`}>
          {response.answer === "unsure" || response.answer === "awaiting"
            ? "What is unknown, and how will it be resolved?"
            : "Finding / evidence"}
        </label>
        <textarea
          id={`ex-${id}`}
          className={missingReason ? "warn" : ""}
          placeholder="Briefly name the component, what stays or changes, and the code check / test supporting this. For Not applicable, explain why."
          value={response.explanation}
          onChange={(e) => onChange({ explanation: e.target.value })}
        />
        {missingReason && (
          <span className="q-warn">
            Add a brief finding to complete this item.
          </span>
        )}
        {response.classification && (
          <span className="hint">{CLASS_HELP[response.classification]}</span>
        )}
      </div>
    </article>
  );
});
export default QuestionRow;
