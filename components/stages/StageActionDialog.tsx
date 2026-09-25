"use client";

import { DISCOVERY_QUESTIONS } from "@/lib/discovery";
import { answerFor, isAnswered } from "@/lib/discoveryAnswers";
import { CONFIRMATIONS } from "@/lib/sections";
import { StageAction, UNANSWERED_NOTE } from "@/lib/stageActions";
import { AssessmentState } from "@/lib/types";
import ConfirmDialog from "./ConfirmDialog";

type Props = {
  state: AssessmentState;
  action: StageAction;
  onToggleCheck: (index: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

function unansweredCount(state: AssessmentState) {
  return DISCOVERY_QUESTIONS.filter((q) => !isAnswered(q, answerFor(state.answers, q.id))).length;
}

/**
 * Confirms a status change. Submitting discovery lists how many questions are unanswered (still allowed);
 * submitting the plan needs every developer confirmation ticked.
 */
export default function StageActionDialog({ state, action, onToggleCheck, onConfirm, onCancel }: Props) {
  const unanswered = action.to === "discovery-submitted" ? unansweredCount(state) : 0;
  const needsChecks = action.to === "plan-submitted";

  return (
    <ConfirmDialog
      title={action.title}
      confirmLabel={action.label}
      confirmDisabled={needsChecks && !state.checks.every(Boolean)}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <p>{action.text}</p>
      {unanswered > 0 && (
        <p className="dialog-note">
          {unanswered} {unanswered === 1 ? "question is" : "questions are"} not answered yet. {UNANSWERED_NOTE}
        </p>
      )}
      {needsChecks && (
        <div className="checks">
          {CONFIRMATIONS.map((text, i) => (
            <label key={text} htmlFor={`chk-${i}`}>
              <input type="checkbox" id={`chk-${i}`} checked={state.checks[i]} onChange={() => onToggleCheck(i)} />
              {text}
            </label>
          ))}
        </div>
      )}
    </ConfirmDialog>
  );
}
