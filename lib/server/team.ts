import type { Role } from "@prisma/client";
import { publicEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { db } from "./db";

export type TeamMember = { id: string; email: string; name: string; role: Role };

const AUTH_PAGE_SIZE = 200;
const AUTH_MAX_PAGES = 25;

export async function listTeam(): Promise<TeamMember[]> {
  const profiles = await db.profile.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } });
  return profiles.map(({ id, email, name, role }) => ({ id, email, name, role }));
}

/** Supabase has no lookup by email, so page through auth users (the team is small). */
async function findAuthUserId(email: string, page = 1): Promise<string | null> {
  if (page > AUTH_MAX_PAGES) return null;
  const { data, error } = await createSupabaseAdminClient().auth.admin.listUsers({ page, perPage: AUTH_PAGE_SIZE });
  if (error) throw error;
  const match = data.users.find((u) => u.email?.toLowerCase() === email);
  if (match) return match.id;
  if (data.users.length < AUTH_PAGE_SIZE) return null;
  return findAuthUserId(email, page + 1);
}

/** Sends the invite email; if the address already has an auth account, reuses it. */
async function inviteOrFindUser(email: string, name: string): Promise<string> {
  const admin = createSupabaseAdminClient();
  const redirectTo = `${publicEnv.siteUrl()}/auth/set-password`;
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo, data: { name } });
  if (!error && data.user) return data.user.id;
  const existingId = await findAuthUserId(email);
  if (existingId) return existingId;
  throw error ?? new Error("Invite returned no user");
}

/** Invites a member and gives them a profile. A previously removed member is restored. */
export async function inviteMember(email: string, name: string, role: Role): Promise<TeamMember> {
  const normalised = email.trim().toLowerCase();
  const userId = await inviteOrFindUser(normalised, name);
  const profile = await db.profile.upsert({
    where: { id: userId },
    create: { id: userId, email: normalised, name, role },
    update: { email: normalised, name, role, deletedAt: null },
  });
  return { id: profile.id, email: profile.email, name: profile.name, role: profile.role };
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
