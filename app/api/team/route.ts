import { NextResponse } from "next/server";
import { createMemberSchema } from "@/lib/schemas/api";
import { requireProduct } from "@/lib/server/auth";
import { AuthUserError } from "@/lib/server/authUsers";
import { handle, jsonError, parseBody } from "@/lib/server/http";
import { createMember, listTeam } from "@/lib/server/team";

export async function GET() {
  return handle("GET /api/team", async () => {
    const auth = await requireProduct();
    if (!auth.ok) return auth.response;
    return NextResponse.json({ members: await listTeam() });
  });
}

/**
 * Creates an account with a temporary password (no email is sent). This response is the only
 * place the password is returned, so the product user can share it once; it is never stored or logged.
 */
export async function POST(request: Request) {
  return handle("POST /api/team", async () => {
    const auth = await requireProduct();
    if (!auth.ok) return auth.response;
    const body = await parseBody(request, createMemberSchema);
    if (!body.ok) return body.response;
    const { email, name, role, temporaryPassword } = body.value;
    try {
      const member = await createMember(email, name, role, temporaryPassword);
      return NextResponse.json({ member, credentials: { email: member.email, temporaryPassword } }, { status: 201 });
    } catch (err) {
      if (err instanceof AuthUserError) return jsonError(400, err.message);
      throw err;
    }
  });
}
