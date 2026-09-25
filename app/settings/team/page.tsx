import AppHeader from "@/components/AppHeader";
import NoAccess from "@/components/auth/NoAccess";
import TeamManager from "@/components/team/TeamManager";
import { canManageTeam } from "@/lib/permissions";
import { getPageAuth } from "@/lib/server/pageAuth";
import { listTeam } from "@/lib/server/team";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team · Prime Conversion" };

export default async function TeamPage() {
  const auth = await getPageAuth();
  if (auth.kind === "no-access") return <NoAccess email={auth.email} />;
  if (!canManageTeam(auth.user.role)) {
    return (
      <div className="page">
        <AppHeader user={auth.user} />
        <main className="page-main">
          <h1>Team</h1>
          <p role="alert">Only the product team can manage team members.</p>
        </main>
      </div>
    );
  }
  return <TeamManager user={auth.user} initialMembers={await listTeam()} />;
}
