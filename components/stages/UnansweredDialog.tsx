"use client";

import ConfirmDialog from "@/components/ConfirmDialog";
import { DiscoveryQuestion } from "@/lib/discoveryTypes";
import { NOT_SURE_NOTE, UNANSWERED_TITLE } from "@/lib/stageActions";

const PROMPT_MAX = 60;

/** Long prompts are shortened so the list stays scannable; the full prompt is in the title attribute. */
function shortPrompt(prompt: string) {
  return prompt.length <= PROMPT_MAX ? prompt : `${prompt.slice(0, PROMPT_MAX).trimEnd()}…`;
}

type Props = {
  questions: DiscoveryQuestion[];
  onJumpToQuestion: (id: string) => void;
  onClose: () => void;
};

/** Shown instead of submitting discovery while questions are unanswered; each item jumps to its question. */
export default function UnansweredDialog({ questions, onJumpToQuestion, onClose }: Props) {
  function jump(id: string) {
    onClose();
    onJumpToQuestion(id);
  }

  return (
    <ConfirmDialog title={UNANSWERED_TITLE} cancelLabel="Close" onCancel={onClose}>
      <ul className="unanswered-list">
        {questions.map((q) => (
          <li key={q.id}>
            <button type="button" className="link-btn" title={q.prompt} onClick={() => jump(q.id)}>{q.id} · {shortPrompt(q.prompt)}</button>
          </li>
        ))}
      </ul>
      <p>{NOT_SURE_NOTE}</p>
    </ConfirmDialog>
  );
}
