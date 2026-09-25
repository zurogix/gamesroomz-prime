"use client";

import { useEffect, useRef, useState } from "react";
import { copyText, downloadText } from "@/lib/download";

type Props = {
  label: string;
  /** Accessible name, e.g. "Export Alex's answers". */
  ariaLabel?: string;
  /** Built on demand so the Markdown is always current. */
  buildMarkdown: () => string;
  fileName: () => string;
};

const COPIED_FOR_MS = 2000;
const COPY_FAILED = "Couldn't copy — use Download instead.";

/** A small menu: "Copy to clipboard" (Markdown) or "Download .md". */
export default function ExportDropdown({ label, ariaLabel, buildMarkdown, fileName }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  function show(text: string, clearAfter?: number) {
    setMessage(text);
    setOpen(false);
    if (timer.current) window.clearTimeout(timer.current);
    if (clearAfter) timer.current = window.setTimeout(() => setMessage(""), clearAfter);
  }

  async function copy() {
    const ok = await copyText(buildMarkdown());
    show(ok ? "Copied" : COPY_FAILED, ok ? COPIED_FOR_MS : undefined);
  }

  function download() {
    show(downloadText(fileName(), buildMarkdown(), "text/markdown") ? "" : "Download failed.");
  }

  return (
    <span className="export-menu">
      <button type="button" className="btn quiet" aria-label={ariaLabel} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)}>
        {label}
      </button>
      {open && (
        <span className="export-options" role="menu">
          <button type="button" role="menuitem" onClick={copy}>Copy to clipboard</button>
          <button type="button" role="menuitem" onClick={download}>Download .md</button>
        </span>
      )}
      {message && <span className="hint export-status" role="status">{message}</span>}
    </span>
  );
}
