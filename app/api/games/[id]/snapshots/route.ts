import { NextResponse } from "next/server";
import { idParamsSchema } from "@/lib/schemas/api";
import { requireProfile } from "@/lib/server/auth";
import { handle, jsonError, parseWith } from "@/lib/server/http";
import { listSnapshots } from "@/lib/server/snapshots";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  return handle("GET /api/games/[id]/snapshots", async () => {
    const auth = await requireProfile();
    if (!auth.ok) return auth.response;
    const parsedParams = parseWith(idParamsSchema, await params);
    if (!parsedParams.ok) return parsedParams.response;
    const snapshots = await listSnapshots(parsedParams.value.id);
    if (!snapshots) return jsonError(404, "Game not found.");
    return NextResponse.json({ snapshots });
  });
}
