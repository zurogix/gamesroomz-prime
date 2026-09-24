"use client";

import { useId, useState } from "react";

export default function HelpMeChoose() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="help-choose">
      <button type="button" className="help-toggle" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)}>
        {open ? "Hide guide" : "Help me choose"}
      </button>
      {open && (
        <ol className="help-guide" id={panelId}>
          <li>
            Does this exist in the game today? <b>No → New</b>
          </li>
          <li>
            Will the existing code be kept? <b>No → Rewrite</b>
          </li>
          <li>
            Will its inside structure change? <b>Yes → Refactor.</b>
            <br />
            No, but new code is added around it <b>→ Extend.</b>
            <br />
            Nothing changes <b>→ Reuse.</b>
          </li>
          <li className="help-aside">
            Taking out a mobile-only feature <b>→ Remove</b>
          </li>
        </ol>
      )}
    </div>
  );
}
