"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import type { TeamMember } from "@/lib/server/team";
import { ROLE_LABEL } from "@/components/UserBadge";
import type { Credentials } from "./OneTimeCredentials";
import ResetPasswordDialog from "./ResetPasswordDialog";

type Props = { member: TeamMember; isSelf: boolean; onChanged: () => void; onPasswordReset: (credentials: Credentials) => void };
type Role = TeamMember["role"];

export default function TeamRow({ member, isSelf, onChanged, onPasswordReset }: Props) {
  const [error, setError] = useState("");
  const [resetting, setResetting] = useState(false);

  async function patch(body: object) {
    setError("");
    const result = await apiRequest(`/api/team/${member.id}`, { method: "PATCH", body: JSON.stringify(body) });
    if (!result.ok) return setError(result.error);
    onChanged();
  }

  function remove() {
    if (!window.confirm(`Remove ${member.name}'s access to the portal? Their account is kept and can be given access again.`)) return;
    patch({ removed: true });
  }

  function reset(credentials: Credentials) {
    setResetting(false);
    onPasswordReset(credentials);
  }

  return (
    <tr>
      <td className="ws">
        <b>{member.name}{isSelf ? " (you)" : ""}</b>
        <small>{member.email}</small>
        {error && <small className="form-error" role="alert">{error}</small>}
      </td>
      <td>
        <select
          aria-label={`Role for ${member.name}`}
          value={member.role}
          disabled={isSelf}
          onChange={(e) => patch({ role: e.target.value as Role })}
        >
          {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </select>
      </td>
      <td className="row-actions">
        {!isSelf && (
          <>
            <button type="button" className="btn quiet" onClick={() => setResetting(true)}>Reset password</button>
            <button type="button" className="btn quiet" onClick={remove}>Remove access</button>
          </>
        )}
        {resetting && <ResetPasswordDialog member={member} onReset={reset} onCancel={() => setResetting(false)} />}
      </td>
    </tr>
  );
}
