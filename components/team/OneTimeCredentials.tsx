"use client";

import { useState } from "react";

export type Credentials = { email: string; temporaryPassword: string };

type Props = { title: string; credentials: Credentials; onDone: () => void };

/** Shows a temporary password once. It lives only in this component's props and is gone after "Done". */
export default function OneTimeCredentials({ title, credentials, onDone }: Props) {
  const [copied, setCopied] = useState("");
  const text = `${credentials.email} / ${credentials.temporaryPassword}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied("Copied.");
    } catch {
      setCopied("Could not copy — select the text and copy it instead.");
    }
  }

  return (
    <section className="card credentials" role="status">
      <p><b>{title}</b> Share these details privately:</p>
      <code className="credentials-text">{text}</code>
      <p className="hint">This password is not stored and won&apos;t be shown again. They will choose their own password when they sign in.</p>
      <div className="pager-actions">
        <button type="button" className="btn" onClick={copy}>Copy</button>
        <button type="button" className="btn quiet" onClick={onDone}>Done</button>
        {copied && <span className="hint" aria-live="polite">{copied}</span>}
      </div>
    </section>
  );
}
