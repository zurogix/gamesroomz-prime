import { NextResponse } from "next/server";
import { manageResponsesRefusal } from "@/lib/responses";
import { removeResponseSchema, responseParamsSchema } from "@/lib/schemas/api";
import { requireProfile } from "@/lib/server/auth";
import { handle, jsonError, parseBody, parseWith, refuse } from "@/lib/server/http";
import { findResponse, removeResponse } from "@/lib/server/responses";

type Context = { params: Promise<{ id: string; responseId: string }> };

/**
 * { remove: true }: product removes a developer's response (soft delete — the answers stay in the
 * database). The developer gets a new blank response on their next visit.
 */
export async function PATCH(request: Request, { params }: Context) {
  return handle("PATCH /api/games/[id]/responses/[responseId]", async () => {
    const auth = await requireProfile();
    if (!auth.ok) return auth.response;
    const manage = manageResponsesRefusal(auth.value);
    if (manage) return refuse(manage);
    const parsed = parseWith(responseParamsSchema, await params);
    if (!parsed.ok) return parsed.response;
    const body = await parseBody(request, removeResponseSchema);
    if (!body.ok) return body.response;

    const response = await findResponse(parsed.value.id, parsed.value.responseId);
    if (!response) return jsonError(404, "Response not found.");
    await removeResponse(response.id);
    return NextResponse.json({ ok: true });
  });
}
