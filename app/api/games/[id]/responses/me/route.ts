import { NextResponse } from "next/server";
import { ANSWERS_CONFLICT, editResponseRefusal, ownResponseRefusal } from "@/lib/responses";
import { idParamsSchema, saveResponseSchema } from "@/lib/schemas/api";
import { requireProfile } from "@/lib/server/auth";
import { handle, jsonError, parseBody, parseWith, refuse } from "@/lib/server/http";
import { findGameStatus, getOrCreateOwnResponse, saveAnswers } from "@/lib/server/responses";

type Context = { params: Promise<{ id: string }> };

/** The developer's own discovery answers for this game; an empty response is created on first access. */
export async function GET(_request: Request, { params }: Context) {
  return handle("GET /api/games/[id]/responses/me", async () => {
    const auth = await requireProfile();
    if (!auth.ok) return auth.response;
    const refusal = ownResponseRefusal(auth.value);
    if (refusal) return refuse(refusal);
    const parsed = parseWith(idParamsSchema, await params);
    if (!parsed.ok) return parsed.response;
    if (!(await findGameStatus(parsed.value.id))) return jsonError(404, "Game not found.");
    return NextResponse.json({ response: await getOrCreateOwnResponse(parsed.value.id, auth.value.id) });
  });
}

/** Saves the developer's own answers (optimistic locking) while their response and the game allow it. */
export async function PUT(request: Request, { params }: Context) {
  return handle("PUT /api/games/[id]/responses/me", async () => {
    const auth = await requireProfile();
    if (!auth.ok) return auth.response;
    const own = ownResponseRefusal(auth.value);
    if (own) return refuse(own);
    const parsed = parseWith(idParamsSchema, await params);
    if (!parsed.ok) return parsed.response;
    const body = await parseBody(request, saveResponseSchema);
    if (!body.ok) return body.response;

    const gameStatus = await findGameStatus(parsed.value.id);
    if (!gameStatus) return jsonError(404, "Game not found.");
    const response = await getOrCreateOwnResponse(parsed.value.id, auth.value.id);
    const refusal = editResponseRefusal(auth.value, response, gameStatus);
    if (refusal) return refuse(refusal);
    const outcome = await saveAnswers(response.id, body.value.answers, body.value.version);
    if (outcome.kind === "conflict") return jsonError(409, ANSWERS_CONFLICT);
    return NextResponse.json({ version: outcome.version, updatedAt: outcome.updatedAt });
  });
}
