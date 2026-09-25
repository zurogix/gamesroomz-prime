"use client";

import { useState } from "react";
import { Role } from "@/lib/permissions";
import { StageAction, stageActionsFor } from "@/lib/stageActions";
import { AssessmentState, AssessmentStatus } from "@/lib/types";
import StageActionDialog from "./StageActionDialog";

type Props = {
  state: AssessmentState;
  role: Role;
  onStatus: (status: AssessmentStatus) => void;
  onToggleCheck: (index: number) => void;
};

/** The status changes this role can make now, each behind a confirmation dialog. */
export default function StageActions({ state, role, onStatus, onToggleCheck }: Props) {
  const [pending, setPending] = useState<StageAction | null>(null);
  const actions = stageActionsFor(role, state.status);
  if (actions.length === 0) return null;

  function confirm() {
    if (!pending) return;
    onStatus(pending.to);
    setPending(null);
  }

  return (
    <>
      {actions.map((a) => (
        <button key={a.to} type="button" className={`btn ${a.primary ? "primary" : ""}`} onClick={() => setPending(a)}>{a.label}</button>
      ))}
      {pending && (
        <StageActionDialog state={state} action={pending} onToggleCheck={onToggleCheck} onConfirm={confirm} onCancel={() => setPending(null)} />
      )}
    </>
  );
}
