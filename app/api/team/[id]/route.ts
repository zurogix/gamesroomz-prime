import { NextResponse } from "next/server";
import { idParamsSchema, updateMemberSchema } from "@/lib/schemas/api";
import { requireProduct } from "@/lib/server/auth";
import { handle, jsonError, parseBody, parseWith } from "@/lib/server/http";
import { changeRole, findActiveMember, removeAccess } from "@/lib/server/team";

type Context = { params: Promise<{ id: string }> };

/** Change a member's role ({ role }) or remove their access ({ removed: true }). Product only. */
export async function PATCH(request: Request, { params }: Context) {
  return handle("PATCH /api/team/[id]", async () => {
    const auth = await requireProduct();
    if (!auth.ok) return auth.response;
    const parsedParams = parseWith(idParamsSchema, await params);
    if (!parsedParams.ok) return parsedParams.response;
    const body = await parseBody(request, updateMemberSchema);
    if (!body.ok) return body.response;

    const { id } = parsedParams.value;
    if (id === auth.value.id) return jsonError(400, "You can't change your own role or access. Ask another product team member.");
    if (!(await findActiveMember(id))) return jsonError(404, "Team member not found.");
    if ("removed" in body.value) {
      await removeAccess(id);
      return NextResponse.json({ ok: true });
    }
    const updated = await changeRole(id, body.value.role);
    return NextResponse.json({ member: { id: updated.id, role: updated.role } });
  });
}
