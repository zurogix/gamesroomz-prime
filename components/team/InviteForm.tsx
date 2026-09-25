"use client";

import { FormEvent, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import { ROLE_LABEL } from "@/components/UserBadge";

type Role = "product" | "developer";

export default function InviteForm({ onInvited }: { onInvited: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("developer");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const result = await apiRequest("/api/team", { method: "POST", body: JSON.stringify({ email, name, role }) });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setMessage(`Invite sent to ${email}.`);
    setEmail("");
    setName("");
    onInvited();
  }

  return (
    <form className="card invite-form" onSubmit={submit}>
      <h2>Invite a team member</h2>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="invite-email">Email</label>
          <input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="invite-name">Name</label>
          <input id="invite-name" type="text" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="invite-role">Role</label>
          <select id="invite-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </div>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="hint" role="status">{message}</p>}
      <div>
        <button type="submit" className="btn primary" disabled={busy}>{busy ? "Sending invite…" : "Send invite"}</button>
      </div>
    </form>
  );
}
