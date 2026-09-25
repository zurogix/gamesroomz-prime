import type { Role } from "@prisma/client";
import { createOrLinkAuthUser, setAuthPassword } from "./authUsers";
import { db } from "./db";

export type TeamMember = { id: string; email: string; name: string; role: Role };

export async function listTeam(): Promise<TeamMember[]> {
  const profiles = await db.profile.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } });
  return profiles.map(({ id, email, name, role }) => ({ id, email, name, role }));
}

/**
 * Creates (or links) the auth account with a temporary password and gives it a profile that must
 * change the password on first sign-in. A previously removed member is restored. The password is
 * passed straight to Supabase and never stored by the app.
 */
export async function createMember(email: string, name: string, role: Role, temporaryPassword: string): Promise<TeamMember> {
  const normalised = email.trim().toLowerCase();
  const userId = await createOrLinkAuthUser(normalised, name, temporaryPassword);
  const profile = await db.profile.upsert({
    where: { id: userId },
    create: { id: userId, email: normalised, name, role, mustChangePassword: true },
    update: { email: normalised, name, role, deletedAt: null, mustChangePassword: true },
  });
  return { id: profile.id, email: profile.email, name: profile.name, role: profile.role };
}

/** Sets a new temporary password; the member must choose their own at next sign-in. */
export async function resetMemberPassword(id: string, temporaryPassword: string) {
  await setAuthPassword(id, temporaryPassword);
  await db.profile.update({ where: { id }, data: { mustChangePassword: true } });
}

export async function markPasswordChanged(id: string) {
  await db.profile.update({ where: { id }, data: { mustChangePassword: false } });
}

export async function findActiveMember(id: string) {
  return db.profile.findFirst({ where: { id, deletedAt: null } });
}

export async function changeRole(id: string, role: Role) {
  return db.profile.update({ where: { id }, data: { role } });
}

/** Removes portal access only: the profile is soft-deleted and the auth user is kept. */
export async function removeAccess(id: string) {
  return db.profile.update({ where: { id }, data: { deletedAt: new Date() } });
}
