"use client";

import { FormEvent, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";
import { changePasswordSchema } from "@/lib/schemas/api";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const FAILED = "Could not change the password. Please try again.";

/** Picks up a fresh session after the change; if that fails the user signs in again with the new password. */
async function refreshSession(): Promise<boolean> {
  try {
    const { error } = await createSupabaseBrowserClient().auth.refreshSession();
    return !error;
  } catch {
    return false;
  }
}

/** Sends the new password to the server, which sets it and clears the temporary-password flag in one request. */
export default function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = changePasswordSchema.safeParse({ password, confirm });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? FAILED);
    setBusy(true);
    setError("");
    const result = await apiRequest("/api/me/password", { method: "POST", body: JSON.stringify({ password }) });
    if (!result.ok) {
      setBusy(false);
      return setError(result.error);
    }
    window.location.assign((await refreshSession()) ? "/" : "/login");
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="new-password">New password</label>
        <input id="new-password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} value={password} onChange={(e) => setPassword(e.target.value)} required />
        <small className="hint">At least {MIN_PASSWORD_LENGTH} characters.</small>
      </div>
      <div className="field">
        <label htmlFor="confirm-password">Confirm new password</label>
        <input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" className="btn primary" disabled={busy}>{busy ? "Saving…" : "Save password"}</button>
    </form>
  );
}
