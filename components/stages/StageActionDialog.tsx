"use client";

import { CONFIRMATIONS } from "@/lib/sections";
import { StageAction } from "@/lib/stageActions";
import { AssessmentState } from "@/lib/types";
import ConfirmDialog from "@/components/ConfirmDialog";

type Props = {
  state: AssessmentState;
  action: StageAction;
  onToggleCheck: (index: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Confirms a status change. Submitting the plan needs every developer confirmation ticked.
 * (Submitting discovery with unanswered questions never gets here: see UnansweredDialog.)
 */
export default function StageActionDialog({ state, action, onToggleCheck, onConfirm, onCancel }: Props) {
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
