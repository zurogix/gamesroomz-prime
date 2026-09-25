import { NextResponse } from "next/server";
import { inviteMemberSchema } from "@/lib/schemas/api";
import { requireProduct } from "@/lib/server/auth";
import { handle, parseBody } from "@/lib/server/http";
import { inviteMember, listTeam } from "@/lib/server/team";

export async function GET() {
  return handle("GET /api/team", async () => {
    const auth = await requireProduct();
    if (!auth.ok) return auth.response;
    return NextResponse.json({ members: await listTeam() });
  });
}

/** Invite by email: Supabase sends the invite, and the member gets a profile with the chosen role. */
export async function POST(request: Request) {
  return handle("POST /api/team", async () => {
    const auth = await requireProduct();
    if (!auth.ok) return auth.response;
    const body = await parseBody(request, inviteMemberSchema);
    if (!body.ok) return body.response;
    const member = await inviteMember(body.value.email, body.value.name, body.value.role);
    return NextResponse.json({ member }, { status: 201 });
  });
}
