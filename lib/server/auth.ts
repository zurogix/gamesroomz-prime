import type { Profile } from "@prisma/client";
import type { User } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "./db";
import { jsonError, Result } from "./http";

export const NO_ACCESS_MESSAGE = "Your account doesn't have access to this portal yet";

export type SessionProfile = Pick<Profile, "id" | "email" | "name" | "role">;

export async function getSessionUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

const toSessionProfile = ({ id, email, name, role }: Profile): SessionProfile => ({ id, email, name, role });

/** The bootstrap product user gets a profile on first login. A removed (soft-deleted) profile stays removed. */
async function bootstrapProfile(user: User): Promise<Profile | null> {
  const email = user.email?.toLowerCase() ?? "";
  const bootstrapEmail = serverEnv.bootstrapProductEmail();
  if (!bootstrapEmail || email !== bootstrapEmail) return null;
  const name = (user.user_metadata?.name as string | undefined) ?? email.split("@")[0];
  // upsert: two first requests may race; the second simply reads the created profile.
  return db.profile.upsert({ where: { id: user.id }, create: { id: user.id, email, name, role: "product" }, update: {} });
}

/** The active profile for a signed-in user, or null when they have no access. */
export async function getProfile(user: User): Promise<SessionProfile | null> {
  const existing = await db.profile.findUnique({ where: { id: user.id } });
  if (existing) return existing.deletedAt ? null : toSessionProfile(existing);
  const created = await bootstrapProfile(user);
  return created ? toSessionProfile(created) : null;
}

/** For API routes: the caller's profile, or a 401/403 response. */
export async function requireProfile(): Promise<Result<SessionProfile>> {
  const user = await getSessionUser();
  if (!user) return { ok: false, response: jsonError(401, "Please sign in.") };
  const profile = await getProfile(user);
  if (!profile) return { ok: false, response: jsonError(403, NO_ACCESS_MESSAGE) };
  return { ok: true, value: profile };
}

export async function requireProduct(): Promise<Result<SessionProfile>> {
  const result = await requireProfile();
  if (!result.ok) return result;
  if (result.value.role !== "product") return { ok: false, response: jsonError(403, "Only the product team can do this.") };
  return result;
}
