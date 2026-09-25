import { NextResponse } from "next/server";
import { ownResponseRefusal, submitResponseRefusal } from "@/lib/responses";
import { idParamsSchema } from "@/lib/schemas/api";
import { requireProfile } from "@/lib/server/auth";
import { handle, jsonError, parseWith, refuse } from "@/lib/server/http";
import { findGameStatus, getOrCreateOwnResponse, markSubmitted } from "@/lib/server/responses";

type Context = { params: Promise<{ id: string }> };

/** Submits the developer's own discovery; every question must have an answer ("Not sure" counts). */
export async function POST(_request: Request, { params }: Context) {
  return handle("POST /api/games/[id]/responses/me/submit", async () => {
    const auth = await requireProfile();
    if (!auth.ok) return auth.response;
    const own = ownResponseRefusal(auth.value);
    if (own) return refuse(own);
    const parsed = parseWith(idParamsSchema, await params);
    if (!parsed.ok) return parsed.response;
    const gameStatus = await findGameStatus(parsed.value.id);
    if (!gameStatus) return jsonError(404, "Game not found.");

    const response = await getOrCreateOwnResponse(parsed.value.id, auth.value.id);
    const refusal = submitResponseRefusal(auth.value, response, gameStatus);
    if (refusal) return refuse(refusal);
    return NextResponse.json({ response: await markSubmitted(response.id) });
  });
}
