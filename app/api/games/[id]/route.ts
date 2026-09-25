import { NextResponse } from "next/server";
import { idParamsSchema, updateGameSchema } from "@/lib/schemas/api";
import { requireProduct } from "@/lib/server/auth";
import { findActiveGame, renameGame, softDeleteGame } from "@/lib/server/games";
import { handle, jsonError, parseBody, parseWith } from "@/lib/server/http";

type Context = { params: Promise<{ id: string }> };

/** Rename ({ name }) or remove ({ deleted: true }, soft delete) a game. Product only. */
export async function PATCH(request: Request, { params }: Context) {
  return handle("PATCH /api/games/[id]", async () => {
    const auth = await requireProduct();
    if (!auth.ok) return auth.response;
    const parsedParams = parseWith(idParamsSchema, await params);
    if (!parsedParams.ok) return parsedParams.response;
    const body = await parseBody(request, updateGameSchema);
    if (!body.ok) return body.response;

    const { id } = parsedParams.value;
    if (!(await findActiveGame(id))) return jsonError(404, "Game not found.");
    if ("deleted" in body.value) {
      await softDeleteGame(id);
      return NextResponse.json({ ok: true });
    }
    const game = await renameGame(id, body.value.name);
    return NextResponse.json({ game: { id: game.id, name: game.name } });
  });
}
