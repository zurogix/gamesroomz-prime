"use client";

import { useState } from "react";
import { unansweredQuestions } from "@/lib/discoveryAnswers";
import { Role } from "@/lib/permissions";
import { StageAction, stageActionsFor } from "@/lib/stageActions";
import { AssessmentState, AssessmentStatus } from "@/lib/types";
import StageActionDialog from "./StageActionDialog";
import UnansweredDialog from "./UnansweredDialog";

type Props = {
  state: AssessmentState;
  role: Role;
  onStatus: (status: AssessmentStatus) => void;
  onToggleCheck: (index: number) => void;
  onJumpToQuestion: (id: string) => void;
  /** Called when "Submit discovery" is refused because questions are unanswered. */
  onSubmitBlocked: () => void;
};

/** The status changes this role can make now, each behind a confirmation dialog. */
export default function StageActions({ state, role, onStatus, onToggleCheck, onJumpToQuestion, onSubmitBlocked }: Props) {
  const [pending, setPending] = useState<StageAction | null>(null);
  const [blocked, setBlocked] = useState(false);
  const actions = stageActionsFor(role, state.status);
  if (actions.length === 0) return null;
  const unanswered = unansweredQuestions(state.answers);

  function start(action: StageAction) {
    if (action.to === "discovery-submitted" && unanswered.length > 0) {
      onSubmitBlocked();
      return setBlocked(true);
    }
    setPending(action);
  }

  function confirm() {
    if (!pending) return;
    onStatus(pending.to);
    setPending(null);
  }

  return (
    <>
      {actions.map((a) => (
        <button key={a.to} type="button" className={`btn ${a.primary ? "primary" : ""}`} onClick={() => start(a)}>{a.label}</button>
      ))}
      {pending && (
        <StageActionDialog state={state} action={pending} onToggleCheck={onToggleCheck} onConfirm={confirm} onCancel={() => setPending(null)} />
      )}
      {blocked && <UnansweredDialog questions={unanswered} onJumpToQuestion={onJumpToQuestion} onClose={() => setBlocked(false)} />}
    </>
  );
}
