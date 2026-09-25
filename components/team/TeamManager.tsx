"use client";

import { useCallback, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import type { TeamMember } from "@/lib/server/team";
import AppHeader from "@/components/AppHeader";
import { CurrentUser } from "@/components/UserBadge";
import CreateAccountForm from "./CreateAccountForm";
import OneTimeCredentials, { Credentials } from "./OneTimeCredentials";
import TeamRow from "./TeamRow";

type Props = { user: CurrentUser; initialMembers: TeamMember[] };

export default function TeamManager({ user, initialMembers }: Props) {
  const [members, setMembers] = useState(initialMembers);
  // Held only in memory until "Done", so the temporary password is shown once.
  const [shown, setShown] = useState<{ title: string; credentials: Credentials } | null>(null);

  const refresh = useCallback(async () => {
    const result = await apiRequest<{ members: TeamMember[] }>("/api/team");
    if (result.ok) setMembers(result.data.members);
  }, []);

  const created = useCallback((credentials: Credentials) => {
    setShown({ title: "Account created.", credentials });
    refresh();
  }, [refresh]);

  const reset = useCallback((credentials: Credentials) => setShown({ title: "Password reset.", credentials }), []);

  return (
    <div className="page">
      <AppHeader user={user} />
      <main className="page-main">
        <h1>Team</h1>
        <p className="hint">
          Only people with an account created here can sign in; nobody receives an email. Product can change everything and
          move the assessment between stages; developers fill in discovery and the plan.
        </p>
        {shown && <OneTimeCredentials title={shown.title} credentials={shown.credentials} onDone={() => setShown(null)} />}
        <CreateAccountForm onCreated={created} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Member</th><th>Role</th><th /></tr>
            </thead>
            <tbody>
              {members.map((m) => <TeamRow key={m.id} member={m} isSelf={m.id === user.id} onChanged={refresh} onPasswordReset={reset} />)}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
