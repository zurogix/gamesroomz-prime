"use client";

import { FormEvent, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { establishSessionFromUrl } from "./establishSession";

const MIN_LENGTH = 8;
type Phase = "checking" | "ready" | "invalid";

/** Used by invite and reset emails: signs the user in from the link, then sets a password. */
export default function SetPasswordForm() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    establishSessionFromUrl(createSupabaseBrowserClient()).then((ok) => setPhase(ok ? "ready" : "invalid"));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password.length < MIN_LENGTH) return setError(`Use at least ${MIN_LENGTH} characters.`);
    if (password !== confirm) return setError("The two passwords don't match.");
    setBusy(true);
    setError("");
    try {
      const { error: updateError } = await createSupabaseBrowserClient().auth.updateUser({ password });
      if (updateError) throw updateError;
      window.location.assign("/");
    } catch {
      setError("Could not set the password. The link may have expired — request a new one.");
    } finally {
      setBusy(false);
    }
  }

  if (phase === "checking") return <p role="status">Checking your link…</p>;
  if (phase === "invalid") {
    return <p role="alert">This link is invalid or has expired. <a href="/forgot-password">Request a new one</a>.</p>;
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="new-password">New password</label>
        <input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="confirm-password">Confirm password</label>
        <input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" className="btn primary" disabled={busy}>{busy ? "Saving…" : "Set password"}</button>
    </form>
  );
}
