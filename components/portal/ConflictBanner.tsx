"use client";

import { useState } from "react";

type Props = { onReload: () => Promise<string | null> };

export default function ConflictBanner({ onReload }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function reload() {
    setBusy(true);
    setError(await onReload() ?? "");
    setBusy(false);
  }

  return (
    <div className="conflict-banner" role="alert">
      <span>Someone else saved changes. Reload to see the latest version.</span>
      <button type="button" className="btn primary" onClick={reload} disabled={busy}>{busy ? "Reloading…" : "Reload"}</button>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
