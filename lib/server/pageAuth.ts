import { redirect } from "next/navigation";
import type { CurrentUser } from "@/components/UserBadge";
import { CHANGE_PASSWORD_PATH } from "@/lib/passwordGate";
import { currentPasswordGate, getProfile, getSessionUser, SessionIdentity, SessionProfile } from "./auth";

export type PageAuth = { kind: "no-access"; email: string } | { kind: "ok"; user: CurrentUser };

/** For server pages: the verified identity, or a redirect to /login for signed-out visitors. */
export async function requirePageIdentity(): Promise<SessionIdentity> {
  const identity = await getSessionUser();
  if (!identity) redirect("/login");
  return identity;
}

/** Pages other than the change-password page send users with a temporary password there first. */
async function enforcePasswordChange(profile: SessionProfile) {
  if ((await currentPasswordGate(profile)) === "redirect") redirect(CHANGE_PASSWORD_PATH);
}

export async function toPageAuth(identity: SessionIdentity, profile: SessionProfile | null): Promise<PageAuth> {
  if (!profile) return { kind: "no-access", email: identity.email };
  await enforcePasswordChange(profile);
  return { kind: "ok", user: { id: profile.id, name: profile.name, email: profile.email, role: profile.role } };
}

/** For pages without their own data: redirects signed-out visitors, reports users without a profile. */
export async function getPageAuth(): Promise<PageAuth> {
  const identity = await requirePageIdentity();
  return toPageAuth(identity, await getProfile(identity));
}
