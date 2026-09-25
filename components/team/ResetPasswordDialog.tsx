"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { apiRequest } from "@/lib/apiClient";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";
import type { TeamMember } from "@/lib/server/team";
import type { Credentials } from "./OneTimeCredentials";

type Props = { member: TeamMember; onReset: (credentials: Credentials) => void; onCancel: () => void };

/** Confirms a password reset; leave the field empty to have the server generate the temporary password. */
export default function ResetPasswordDialog({ member, onReset, onCancel }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    setError("");
    const body = JSON.stringify(password ? { temporaryPassword: password } : {});
    const result = await apiRequest<{ credentials: Credentials }>(`/api/team/${member.id}/reset-password`, { method: "POST", body });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    onReset(result.data.credentials);
  }

  return (
    <ConfirmDialog title={`Reset ${member.name}'s password?`} confirmLabel={busy ? "Resetting…" : "Reset password"} confirmDisabled={busy} onConfirm={confirm} onCancel={onCancel}>
      <p>They get a new temporary password and must choose their own when they next sign in. Their current password stops working.</p>
      <div className="field">
        <label htmlFor="reset-password">Temporary password (optional)</label>
        <input
          id="reset-password"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="Leave empty to generate one"
          minLength={MIN_PASSWORD_LENGTH}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </ConfirmDialog>
  );
}
