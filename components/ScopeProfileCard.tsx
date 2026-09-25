import { ScopeProfile } from "@/lib/scopeProfile";
import ScopeGroupTable from "./ScopeGroupTable";

export default function ScopeProfileCard({ profile }: { profile: ScopeProfile }) {
  return (
    <section className="card">
      <h2>Scope profile</h2>
      {profile.incomplete && <p className="scope-incomplete">{profile.incomplete}</p>}
      <div className="grid-2">
        <ScopeGroupTable group={profile.game} />
        <ScopeGroupTable group={profile.platform} />
      </div>
    </section>
  );
}
