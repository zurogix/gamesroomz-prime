"use client";

import { FormEvent, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import { generatePassword, MIN_PASSWORD_LENGTH } from "@/lib/password";
import { ROLE_LABEL } from "@/components/UserBadge";
import type { Credentials } from "./OneTimeCredentials";

type Role = "product" | "developer";

type Props = { onCreated: (credentials: Credentials) => void };

/** Creates an account with a temporary password; no email is sent. */
export default function CreateAccountForm({ onCreated }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("developer");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const body = JSON.stringify({ email, name, role, temporaryPassword: password });
    const result = await apiRequest<{ credentials: Credentials }>("/api/team", { method: "POST", body });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setEmail("");
    setName("");
    setPassword("");
    onCreated(result.data.credentials);
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>Create account</h2>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="create-name">Name</label>
          <input id="create-name" type="text" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="create-email">Email</label>
          <input id="create-email" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="create-role">Role</label>
          <select id="create-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="create-password">Temporary password</label>
          <div className="input-row">
            <input
              id="create-password"
              type="text"
              autoComplete="off"
              spellCheck={false}
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" className="btn" onClick={() => setPassword(generatePassword())}>Generate</button>
          </div>
          <small className="hint">At least {MIN_PASSWORD_LENGTH} characters. They must change it when they first sign in.</small>
        </div>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div>
        <button type="submit" className="btn primary" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
      </div>
    </form>
  );
}
