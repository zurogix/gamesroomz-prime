import { NextResponse } from "next/server";
import { generatePassword } from "@/lib/password";
import { idParamsSchema, resetPasswordSchema } from "@/lib/schemas/api";
import { requireProduct } from "@/lib/server/auth";
import { AuthUserError } from "@/lib/server/authUsers";
import { handle, jsonError, parseBody, parseWith } from "@/lib/server/http";
import { findActiveMember, resetMemberPassword } from "@/lib/server/team";

type Context = { params: Promise<{ id: string }> };

/**
 * Sets a new temporary password (the one sent, or a generated one) and returns it once.
 * Product only, and not for yourself: use Change password instead.
 */
export async function POST(request: Request, { params }: Context) {
  return handle("POST /api/team/[id]/reset-password", async () => {
    const auth = await requireProduct();
    if (!auth.ok) return auth.response;
    const parsedParams = parseWith(idParamsSchema, await params);
    if (!parsedParams.ok) return parsedParams.response;
    const body = await parseBody(request, resetPasswordSchema);
    if (!body.ok) return body.response;

    const { id } = parsedParams.value;
    if (id === auth.value.id) return jsonError(400, "Use Change password to change your own password.");
    const member = await findActiveMember(id);
    if (!member) return jsonError(404, "Team member not found.");
    const temporaryPassword = body.value.temporaryPassword ?? generatePassword();
    try {
      await resetMemberPassword(id, temporaryPassword);
    } catch (err) {
      if (err instanceof AuthUserError) return jsonError(400, err.message);
      throw err;
    }
    return NextResponse.json({ credentials: { email: member.email, temporaryPassword } });
  });
}
