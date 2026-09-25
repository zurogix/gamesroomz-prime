import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const AUTH_PAGE_SIZE = 200;
const AUTH_MAX_PAGES = 25;

/** A Supabase refusal the product user can act on (e.g. a password the project's policy rejects). */
export class AuthUserError extends Error {}

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;
type AuthError = { code?: string; message: string } | null;

/** Turns known Supabase refusals into messages for the product user; never includes the password. */
function toAuthUserError(error: AuthError): Error {
  if (error?.code === "weak_password") return new AuthUserError("Supabase rejected that password as too weak. Generate one or choose a longer one.");
  return new Error(`Supabase admin request failed (${error?.code ?? "unknown"})`);
}

/** Supabase has no lookup by email, so page through auth users (the team is small). */
async function findAuthUserId(admin: AdminClient, email: string, page = 1): Promise<string | null> {
  if (page > AUTH_MAX_PAGES) return null;
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: AUTH_PAGE_SIZE });
  if (error) throw toAuthUserError(error);
  const match = data.users.find((u) => u.email?.toLowerCase() === email);
  if (match) return match.id;
  if (data.users.length < AUTH_PAGE_SIZE) return null;
  return findAuthUserId(admin, email, page + 1);
}

export async function setAuthPassword(userId: string, password: string, admin: AdminClient = createSupabaseAdminClient()) {
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) throw toAuthUserError(error);
}

/**
 * Creates a confirmed auth user with the temporary password (no email is sent). If the address
 * already has an auth user (e.g. added in the Supabase dashboard), that user is linked instead:
 * its password is set to the temporary one and its id is returned.
 */
export async function createOrLinkAuthUser(email: string, name: string, password: string): Promise<string> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
  if (!error && data.user) return data.user.id;
  if (error?.code !== "email_exists") throw toAuthUserError(error);
  const existingId = await findAuthUserId(admin, email);
  if (!existingId) throw toAuthUserError(error);
  await setAuthPassword(existingId, password, admin);
  return existingId;
}
