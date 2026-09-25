"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import type { TeamMember } from "@/lib/server/team";
import { ROLE_LABEL } from "@/components/UserBadge";

type Props = { member: TeamMember; isSelf: boolean; onChanged: () => void };
type Role = TeamMember["role"];

export default function TeamRow({ member, isSelf, onChanged }: Props) {
  const [error, setError] = useState("");

  async function patch(body: object) {
    setError("");
    const result = await apiRequest(`/api/team/${member.id}`, { method: "PATCH", body: JSON.stringify(body) });
    if (!result.ok) return setError(result.error);
    onChanged();
  }

  function remove() {
    if (!window.confirm(`Remove ${member.name}'s access to the portal? Their account is kept and can be invited again.`)) return;
    patch({ removed: true });
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
        {!isSelf && <button type="button" className="btn quiet" onClick={remove}>Remove access</button>}
      </td>
    </tr>
  );
}
