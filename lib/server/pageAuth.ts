import { redirect } from "next/navigation";
import type { CurrentUser } from "@/components/UserBadge";
import { getProfile, getSessionUser, SessionIdentity, SessionProfile } from "./auth";

export type PageAuth = { kind: "no-access"; email: string } | { kind: "ok"; user: CurrentUser };

/** For server pages: the verified identity, or a redirect to /login for signed-out visitors. */
export async function requirePageIdentity(): Promise<SessionIdentity> {
  const identity = await getSessionUser();
  if (!identity) redirect("/login");
  return identity;
}

export function toPageAuth(identity: SessionIdentity, profile: SessionProfile | null): PageAuth {
  if (!profile) return { kind: "no-access", email: identity.email };
  return { kind: "ok", user: { id: profile.id, name: profile.name, email: profile.email, role: profile.role } };
}

/** For pages without their own data: redirects signed-out visitors, reports users without a profile. */
export async function getPageAuth(): Promise<PageAuth> {
  const identity = await requirePageIdentity();
  return toPageAuth(identity, await getProfile(identity));
}
