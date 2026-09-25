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
  /** For "Publish findings": who hasn't submitted, or why it can't be published yet. */
  publishNote?: { blocked: boolean; text: string } | null;
};

/**
 * Confirms a status change. Submitting the plan needs every developer confirmation ticked.
 * Publishing findings lists developers who haven't submitted, and needs at least one who has.
 */
export default function StageActionDialog({ state, action, onToggleCheck, onConfirm, onCancel, publishNote }: Props) {
  const needsChecks = action.to === "plan-submitted";
  const note = action.to === "findings" ? publishNote : null;

  return (
    <ConfirmDialog
      title={action.title}
      confirmLabel={action.label}
      confirmDisabled={(needsChecks && !state.checks.every(Boolean)) || Boolean(note?.blocked)}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <p>{action.text}</p>
      {note && <p className="dialog-note">{note.text}</p>}
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
