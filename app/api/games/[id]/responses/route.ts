import { NextResponse } from "next/server";
import { manageResponsesRefusal } from "@/lib/responses";
import { idParamsSchema } from "@/lib/schemas/api";
import { requireProfile } from "@/lib/server/auth";
import { handle, jsonError, parseWith, refuse } from "@/lib/server/http";
import { findGameStatus, listResponses } from "@/lib/server/responses";

type Context = { params: Promise<{ id: string }> };

/** Every developer's active response for the game (name, status, submitted date, answers). Product only. */
export async function GET(_request: Request, { params }: Context) {
  return handle("GET /api/games/[id]/responses", async () => {
    const auth = await requireProfile();
    if (!auth.ok) return auth.response;
    const refusal = manageResponsesRefusal(auth.value);
    if (refusal) return refuse(refusal);
    const parsed = parseWith(idParamsSchema, await params);
    if (!parsed.ok) return parsed.response;
    if (!(await findGameStatus(parsed.value.id))) return jsonError(404, "Game not found.");
    return NextResponse.json({ responses: await listResponses(parsed.value.id) });
  });
}
