"use client";

import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

type Props = {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * A small modal asking the user to confirm an action. Escape or the backdrop cancels.
 * Rendered on document.body so a header with backdrop-filter cannot clip it.
 */
export default function ConfirmDialog({ title, children, confirmLabel, confirmDisabled = false, onConfirm, onCancel }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return createPortal(
    <>
      <div className="scrim" onClick={onCancel} aria-hidden="true" />
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">{title}</h2>
        <div className="dialog-body">{children}</div>
        <div className="dialog-foot">
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn primary" onClick={onConfirm} disabled={confirmDisabled} autoFocus>{confirmLabel}</button>
        </div>
      </div>
    </>,
    document.body,
  );
}
