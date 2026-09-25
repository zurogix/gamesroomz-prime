import { NextResponse } from "next/server";
import { createGameSchema } from "@/lib/schemas/api";
import { requireProduct, requireProfile } from "@/lib/server/auth";
import { createGame, listGames } from "@/lib/server/games";
import { handle, parseBody } from "@/lib/server/http";

export async function GET() {
  return handle("GET /api/games", async () => {
    const auth = await requireProfile();
    if (!auth.ok) return auth.response;
    return NextResponse.json({ games: await listGames(auth.value) });
  });
}

export async function POST(request: Request) {
  return handle("POST /api/games", async () => {
    const auth = await requireProduct();
    if (!auth.ok) return auth.response;
    const body = await parseBody(request, createGameSchema);
    if (!body.ok) return body.response;
    const game = await createGame(auth.value, body.value.name);
    return NextResponse.json({ game }, { status: 201 });
  });
}
