"use client";

import { useCallback, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import type { TeamMember } from "@/lib/server/team";
import AppHeader from "@/components/AppHeader";
import { CurrentUser } from "@/components/UserBadge";
import InviteForm from "./InviteForm";
import TeamRow from "./TeamRow";

type Props = { user: CurrentUser; initialMembers: TeamMember[] };

export default function TeamManager({ user, initialMembers }: Props) {
  const [members, setMembers] = useState(initialMembers);

  const refresh = useCallback(async () => {
    const result = await apiRequest<{ members: TeamMember[] }>("/api/team");
    if (result.ok) setMembers(result.data.members);
  }, []);

  return (
    <div className="page">
      <AppHeader user={user} />
      <main className="page-main">
        <h1>Team</h1>
        <p className="hint">
          Only invited people can sign in. Product can change everything and move the assessment between stages; developers fill in
          discovery and the plan.
        </p>
        <InviteForm onInvited={refresh} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Member</th><th>Role</th><th /></tr>
            </thead>
            <tbody>
              {members.map((m) => <TeamRow key={m.id} member={m} isSelf={m.id === user.id} onChanged={refresh} />)}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
