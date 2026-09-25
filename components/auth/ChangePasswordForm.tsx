"use client";

import { FormEvent, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";
import { changePasswordSchema } from "@/lib/schemas/api";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const SAME_PASSWORD = "Choose a password that is different from your current one.";
const FAILED = "Could not change the password. Please try again.";

/** Sets a new password with Supabase, then clears the temporary-password flag. */
export default function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function updatePassword(): Promise<string | null> {
    try {
      const { error: updateError } = await createSupabaseBrowserClient().auth.updateUser({ password });
      if (!updateError) return null;
      return updateError.code === "same_password" ? SAME_PASSWORD : FAILED;
    } catch {
      return FAILED;
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = changePasswordSchema.safeParse({ password, confirm });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? FAILED);
    setBusy(true);
    setError("");
    const updateError = await updatePassword();
    if (updateError) {
      setBusy(false);
      return setError(updateError);
    }
    const cleared = await apiRequest("/api/me/password-changed", { method: "POST", body: "{}" });
    setBusy(false);
    if (!cleared.ok) return setError(cleared.error);
    window.location.assign("/");
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
