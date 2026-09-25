import { CSSProperties } from "react";
import { discoveryAttention } from "@/lib/discoveryAnswers";
import { AssessmentState } from "@/lib/types";

type Props = { answers: AssessmentState["answers"]; onJumpToQuestion: (id: string) => void };

const PREVIEW_LENGTH = 64;
const tone = { "--c": "var(--warn)" } as CSSProperties;

function preview(text: string) {
  return text.length > PREVIEW_LENGTH ? text.slice(0, PREVIEW_LENGTH) + "…" : text;
}

export default function RailFollowUp({ answers, onJumpToQuestion }: Props) {
  const attention = discoveryAttention(answers);
  return (
    <section>
      <span className="label">To follow up · {attention.length}</span>
      <div className="att">
        {attention.length === 0 && <span className="hint">Nothing noted yet.</span>}
        {attention.map(({ question, reason }) => (
          <button key={question.id} type="button" style={tone} onClick={() => onJumpToQuestion(question.id)}>
            <i />
            <span>
              {question.id} · {reason}
              <em>{preview(question.prompt)}</em>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
