import type { Profile } from "@prisma/client";
import { headers } from "next/headers";
import { cache } from "react";
import { serverEnv } from "@/lib/env";
import { MUST_CHANGE_PASSWORD_MESSAGE, PATHNAME_HEADER, passwordChangeGate, PasswordGate } from "@/lib/passwordGate";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "./db";
import { jsonError, Result } from "./http";

export const NO_ACCESS_MESSAGE = "Your account doesn't have access to this portal yet";

export type SessionProfile = Pick<Profile, "id" | "email" | "name" | "role" | "mustChangePassword">;

/** Who the session token belongs to. Access still requires an active Profile (see getProfile). */
export type SessionIdentity = { id: string; email: string; name: string };

/**
 * Verifies the session token. With asymmetric JWT signing keys getClaims() checks the signature
 * locally; otherwise it falls back to asking Supabase Auth. cache(): at most once per request.
 */
export const getSessionUser = cache(async (): Promise<SessionIdentity | null> => {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims.sub) return null;
    const { sub, email, user_metadata: metadata } = data.claims;
    const name = typeof metadata?.name === "string" ? metadata.name : "";
    return { id: sub, email: email?.toLowerCase() ?? "", name };
  } catch (err) {
    console.error("[auth] session check failed", err);
    return null;
  }
});

const toSessionProfile = ({ id, email, name, role, mustChangePassword }: Profile): SessionProfile => ({ id, email, name, role, mustChangePassword });

/** What the temporary-password gate says about the current request (see the middleware). */
export async function currentPasswordGate(profile: SessionProfile): Promise<PasswordGate> {
  if (!profile.mustChangePassword) return "allow";
  const pathname = (await headers()).get(PATHNAME_HEADER) ?? "";
  return passwordChangeGate(pathname);
}

/** The bootstrap product user gets a profile on first login. A removed (soft-deleted) profile stays removed. */
async function bootstrapProfile(identity: SessionIdentity): Promise<Profile | null> {
  const { id, email } = identity;
  const bootstrapEmail = serverEnv.bootstrapProductEmail();
  if (!bootstrapEmail || email !== bootstrapEmail) return null;
  const name = identity.name || email.split("@")[0];
  // upsert: two first requests may race; the second simply reads the created profile.
  return db.profile.upsert({ where: { id }, create: { id, email, name, role: "product" }, update: {} });
}

/**
 * The active profile for a signed-in user, or null when they have no access (no profile, or a
 * removed one with deletedAt set). cache(): at most once per request for the same identity.
 */
export const getProfile = cache(async (identity: SessionIdentity): Promise<SessionProfile | null> => {
  const existing = await db.profile.findUnique({ where: { id: identity.id } });
  if (existing) return existing.deletedAt ? null : toSessionProfile(existing);
  const created = await bootstrapProfile(identity);
  return created ? toSessionProfile(created) : null;
});

/**
 * For API routes: the caller's profile, or a 401/403 response. While the caller still has a
 * temporary password, only /api/me and /api/me/password-changed are answered.
 */
export async function requireProfile(): Promise<Result<SessionProfile>> {
  const user = await getSessionUser();
  if (!user) return { ok: false, response: jsonError(401, "Please sign in.") };
  const profile = await getProfile(user);
  if (!profile) return { ok: false, response: jsonError(403, NO_ACCESS_MESSAGE) };
  if ((await currentPasswordGate(profile)) !== "allow") return { ok: false, response: jsonError(403, MUST_CHANGE_PASSWORD_MESSAGE) };
  return { ok: true, value: profile };
}

export async function requireProduct(): Promise<Result<SessionProfile>> {
  const result = await requireProfile();
  if (!result.ok) return result;
  if (result.value.role !== "product") return { ok: false, response: jsonError(403, "Only the product team can do this.") };
  return result;
}
