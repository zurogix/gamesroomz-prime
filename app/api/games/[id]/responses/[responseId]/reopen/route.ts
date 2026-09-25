import { NextResponse } from "next/server";
import { manageResponsesRefusal, reopenResponseRefusal } from "@/lib/responses";
import { responseParamsSchema } from "@/lib/schemas/api";
import { requireProfile } from "@/lib/server/auth";
import { handle, jsonError, parseWith, refuse } from "@/lib/server/http";
import { findGameStatus, findResponse, reopenResponse } from "@/lib/server/responses";

type Context = { params: Promise<{ id: string; responseId: string }> };

/** Product sends a submitted response back to its developer (only while the game is in discovery). */
export async function POST(_request: Request, { params }: Context) {
  return handle("POST /api/games/[id]/responses/[responseId]/reopen", async () => {
    const auth = await requireProfile();
    if (!auth.ok) return auth.response;
    const manage = manageResponsesRefusal(auth.value);
    if (manage) return refuse(manage);
    const parsed = parseWith(responseParamsSchema, await params);
    if (!parsed.ok) return parsed.response;

    const gameStatus = await findGameStatus(parsed.value.id);
    const response = gameStatus ? await findResponse(parsed.value.id, parsed.value.responseId) : null;
    if (!gameStatus || !response) return jsonError(404, "Response not found.");
    const refusal = reopenResponseRefusal(auth.value, response, gameStatus);
    if (refusal) return refuse(refusal);
    return NextResponse.json({ response: await reopenResponse(response.id) });
  });
}
