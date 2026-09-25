import { CSSProperties } from "react";
import { AnswerMap, discoveryAttention } from "@/lib/discoveryAnswers";

type Props = { answers: AnswerMap; onJumpToQuestion: (id: string) => void };

export const OPEN_ITEMS_NOTE =
  "Answers marked 'Not sure', 'Assumption' or 'Needs investigation'. You can still submit — these will be discussed together.";

const PREVIEW_LENGTH = 64;
const tone = { "--c": "var(--warn)" } as CSSProperties;

function preview(text: string) {
  return text.length > PREVIEW_LENGTH ? text.slice(0, PREVIEW_LENGTH) + "…" : text;
}

export default function RailFollowUp({ answers, onJumpToQuestion }: Props) {
  const attention = discoveryAttention(answers);
  return (
    <section>
      <span className="label">Open items · {attention.length}</span>
      <p className="rail-note">{OPEN_ITEMS_NOTE}</p>
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
