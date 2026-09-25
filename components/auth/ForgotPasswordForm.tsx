"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const redirectTo = `${window.location.origin}/auth/set-password`;
      const { error: resetError } = await createSupabaseBrowserClient().auth.resetPasswordForEmail(email, { redirectTo });
      if (resetError) throw resetError;
      // Supabase answers the same way whether or not the address has an account.
      setSent(true);
    } catch {
      setError("Could not send the email. Please try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) return <p>If an account exists for {email}, an email with a link to set a new password is on its way.</p>;

  return (
    <form className="auth-form" onSubmit={submit}>
      <p className="hint">Enter your email and we&apos;ll send you a link to set a new password.</p>
      <div className="field">
        <label htmlFor="reset-email">Email</label>
        <input id="reset-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" className="btn primary" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
      <a className="hint" href="/login">Back to sign in</a>
    </form>
  );
}
