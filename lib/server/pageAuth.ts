import { redirect } from "next/navigation";
import type { CurrentUser } from "@/components/UserBadge";
import { getProfile, getSessionUser } from "./auth";

export type PageAuth = { kind: "no-access"; email: string } | { kind: "ok"; user: CurrentUser };

/** For server pages: redirects signed-out visitors, and reports users without a profile. */
export async function getPageAuth(): Promise<PageAuth> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");
  const profile = await getProfile(sessionUser);
  if (!profile) return { kind: "no-access", email: sessionUser.email ?? "" };
  return { kind: "ok", user: { id: profile.id, name: profile.name, email: profile.email, role: profile.role } };
}
