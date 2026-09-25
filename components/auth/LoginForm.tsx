"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { error: signInError } = await createSupabaseBrowserClient().auth.signInWithPassword({ email, password });
      if (signInError) {
        setError("Email or password is incorrect.");
        return;
      }
      window.location.assign("/");
    } catch {
      setError("Could not sign in. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="login-email">Email</label>
        <input id="login-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="login-password">Password</label>
        <input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" className="btn primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      <a className="hint" href="/forgot-password">Forgot your password?</a>
    </form>
  );
}
