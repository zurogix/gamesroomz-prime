import AuthCard from "@/components/auth/AuthCard";
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";
import NoAccess from "@/components/auth/NoAccess";
import SignOutButton from "@/components/auth/SignOutButton";
import { getProfile } from "@/lib/server/auth";
import { requirePageIdentity } from "@/lib/server/pageAuth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Change password · Prime Conversion" };

/** Signed-in users only. Users with a temporary password are sent here until they choose their own. */
export default async function ChangePasswordPage() {
  const identity = await requirePageIdentity();
  const profile = await getProfile(identity);
  if (!profile) return <NoAccess email={identity.email} />;
  const required = profile.mustChangePassword;

  return (
    <AuthCard title={required ? "Choose your password" : "Change password"}>
      <p className="hint">
        {required
          ? "You signed in with a temporary password. Choose your own password to continue."
          : `Signed in as ${profile.email}.`}
      </p>
      <ChangePasswordForm />
      {required ? <SignOutButton /> : <a className="hint" href="/">← Back to the portal</a>}
    </AuthCard>
  );
}
