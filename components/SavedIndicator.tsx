"use client";

import { useEffect, useState } from "react";
import SaveStatusLabel from "./SaveStatusLabel";
import { useSaveStatus } from "./SaveStatusContext";

const TICK_MS = 5000;

export default function SavedIndicator() {
  const status = useSaveStatus();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(timer);
  }, [status?.savedAt]);

  if (!status) return null;
  return (
    <span className={`saved saved-${status.state}`} role="status" title={status.message || undefined}>
      <i aria-hidden="true" />
      <SaveStatusLabel status={status} now={now} />
    </span>
  );
}
