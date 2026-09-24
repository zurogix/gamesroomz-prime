import { forwardRef } from "react";
import { ANSWERS, CLASS_HELP, CLASS_LABEL } from "@/lib/sections";
import { Answer, Question, QuestionResponse } from "@/lib/types";
import HelpMeChoose from "./HelpMeChoose";
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
  ref
) {
  const { id } = question;
  const heavy = response.classification === "rewrite" || response.classification === "new";
  const missingReason = heavy && !response.explanation.trim();
  const toggleAnswer = (value: Answer) => onChange({ answer: response.answer === value ? "" : value });

  return (
    <article ref={ref} className={`q ${focused ? "focus" : ""}`} onClick={onFocus} onFocus={onFocus}>
      <div className="q-main">
        <div className="q-text">
          <span className="q-num">{number}.</span>
          <div>
            <p>{question.prompt}</p>
            {question.helper && <small>{question.helper}</small>}
            {missingReason && response.classification && (
              <span className="q-warn">⚠ {CLASS_LABEL[response.classification]} needs an explanation</span>
            )}
          </div>
        </div>

        <div className="ctl ctl-answer">
          <span className="ctl-title" id={`al-${id}`}>Answer</span>
          <div className="seg" role="group" aria-labelledby={`al-${id}`}>
            {ANSWERS.map((a) => (
              <button key={a.value} type="button" className={response.answer === a.value ? "on" : ""} aria-pressed={response.answer === a.value} onClick={() => toggleAnswer(a.value)}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ctl ctl-impact">
          <span className="ctl-title" id={`il-${id}`}>Impact</span>
          <div className="impact-row">
            <ImpactButtons value={response.classification} labelledBy={`il-${id}`} onChange={(classification) => onChange({ classification })} />
            <HelpMeChoose />
          </div>
        </div>
      </div>

      <div className="q-detail field">
        <label htmlFor={`ex-${id}`}>Explanation</label>
        <textarea
          id={`ex-${id}`}
          className={missingReason ? "warn" : ""}
          placeholder="How does the existing implementation work, and why does it need to change — or not?"
          value={response.explanation}
          onChange={(e) => onChange({ explanation: e.target.value })}
        />
        {response.classification && <span className="hint">{CLASS_HELP[response.classification]}</span>}
      </div>
    </article>
  );
});

export default QuestionRow;
