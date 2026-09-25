"use client";

import { useState } from "react";
import { copyText, downloadText, exportBaseName } from "@/lib/download";
import { buildDiscoveryMarkdown } from "@/lib/exportMarkdown";
import { ExportResponse } from "@/lib/exportMarkdown";
import { AssessmentState } from "@/lib/types";

/** Product exports every developer's answers; a developer exports their own. */
export default function ExportMenu({ state, responses }: { state: AssessmentState; responses: ExportResponse[] }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const base = exportBaseName(state.gameInfo.gameName);

  const report = (ok: boolean, success: string, failure: string) => {
    setMessage(ok ? success : failure);
    setOpen(false);
  };

  async function copyMarkdown() {
    const ok = await copyText(buildDiscoveryMarkdown(state, responses));
    report(ok, "Markdown copied", "Copy was blocked by the browser — use Download .md instead");
  }

  function downloadMarkdown() {
    report(downloadText(`${base}.md`, buildDiscoveryMarkdown(state, responses), "text/markdown"), "Downloaded .md", "Download failed");
  }

  function downloadJson() {
    report(downloadText(`${base}.json`, JSON.stringify({ ...state, discoveryResponses: responses }, null, 2), "application/json"), "Downloaded .json", "Download failed");
  }

  return (
    <div className="export-menu">
      <button type="button" className="btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>Export answers</button>
      {open && (
        <div className="export-options" role="menu">
          <button type="button" role="menuitem" onClick={copyMarkdown}>Copy as Markdown</button>
          <button type="button" role="menuitem" onClick={downloadMarkdown}>Download .md</button>
          <button type="button" role="menuitem" onClick={downloadJson}>Download .json (full state)</button>
        </div>
      )}
      {message && <span className="hint export-status" role="status">{message}</span>}
    </div>
  );
}
