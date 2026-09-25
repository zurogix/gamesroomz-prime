"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { DiscoveryQuestion } from "@/lib/discoveryTypes";
import { SUBMIT_DISCOVERY } from "@/lib/stageActions";
import UnansweredDialog from "./UnansweredDialog";

type Props = {
  unanswered: DiscoveryQuestion[];
  /** Saves pending answers and submits; resolves to an error message or null. */
  onSubmit: () => Promise<string | null>;
  onJumpToQuestion: (id: string) => void;
  /** Called when submitting is refused because questions are unanswered. */
  onBlocked: () => void;
};

type Dialog = "none" | "blocked" | "confirm";

/** A developer submits their own discovery; unanswered questions are listed instead of submitting. */
export default function SubmitDiscoveryButton({ unanswered, onSubmit, onJumpToQuestion, onBlocked }: Props) {
  const [dialog, setDialog] = useState<Dialog>("none");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function start() {
    setError("");
    if (unanswered.length === 0) return setDialog("confirm");
    onBlocked();
    setDialog("blocked");
  }

  async function confirm() {
    setBusy(true);
    const failure = await onSubmit();
    setBusy(false);
    if (failure) return setError(failure);
    setDialog("none");
  }

  return (
    <>
      <button type="button" className="btn primary" onClick={start}>{SUBMIT_DISCOVERY.label}</button>
      {dialog === "blocked" && <UnansweredDialog questions={unanswered} onJumpToQuestion={onJumpToQuestion} onClose={() => setDialog("none")} />}
      {dialog === "confirm" && (
        <ConfirmDialog
          title={SUBMIT_DISCOVERY.title}
          confirmLabel={busy ? "Submitting…" : SUBMIT_DISCOVERY.label}
          confirmDisabled={busy}
          onConfirm={confirm}
          onCancel={() => setDialog("none")}
        >
          <p>{SUBMIT_DISCOVERY.text}</p>
          {error && <p className="form-error" role="alert">{error}</p>}
        </ConfirmDialog>
      )}
    </>
  );
}
