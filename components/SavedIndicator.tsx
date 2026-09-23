"use client";

import { useEffect, useState } from "react";

const TICK_MS = 5000;

function describe(savedAt: number | null, now: number) {
  if (!savedAt) return "Draft saved in this browser";
  const seconds = Math.max(0, Math.round((now - savedAt) / 1000));
  if (seconds < 5) return "Autosaved just now";
  if (seconds < 60) return `Autosaved ${seconds}s ago`;
  return `Autosaved ${Math.round(seconds / 60)} min ago`;
}

export default function SavedIndicator({ savedAt }: { savedAt: number | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(timer);
  }, [savedAt]);

  return (
    <span className="saved" role="status">
      <i aria-hidden="true" />
      {describe(savedAt, now)}
    </span>
  );
}
