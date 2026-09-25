import { NextResponse } from "next/server";
import { newPasswordSchema } from "@/lib/schemas/api";
import { requireProfile } from "@/lib/server/auth";
import { AuthUserError } from "@/lib/server/authUsers";
import { handle, jsonError, parseBody } from "@/lib/server/http";
import { changeOwnPassword } from "@/lib/server/team";

/**
 * Sets the signed-in user's password and clears their temporary-password flag in one request.
 * The password goes straight to Supabase; it is never logged or returned.
 */
export async function POST(request: Request) {
  return handle("POST /api/me/password", async () => {
    const auth = await requireProfile();
    if (!auth.ok) return auth.response;
    const body = await parseBody(request, newPasswordSchema);
    if (!body.ok) return body.response;
    try {
      await changeOwnPassword(auth.value.id, body.value.password);
    } catch (err) {
      if (err instanceof AuthUserError) return jsonError(400, err.message);
      throw err;
    }
    return NextResponse.json({ ok: true });
  });
}
