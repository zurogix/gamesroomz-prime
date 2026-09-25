import { NextResponse } from "next/server";
import { idParamsSchema, saveAssessmentSchema } from "@/lib/schemas/api";
import { requireProfile } from "@/lib/server/auth";
import { loadAssessment } from "@/lib/server/games";
import { handle, jsonError, parseBody, parseWith } from "@/lib/server/http";
import { saveAssessment } from "@/lib/server/saveAssessment";
import { CONFLICT_MESSAGE } from "@/lib/versioning";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  return handle("GET /api/games/[id]/assessment", async () => {
    const auth = await requireProfile();
    if (!auth.ok) return auth.response;
    const parsedParams = parseWith(idParamsSchema, await params);
    if (!parsedParams.ok) return parsedParams.response;
    const assessment = await loadAssessment(parsedParams.value.id);
    if (!assessment) return jsonError(404, "Game not found.");
    return NextResponse.json({ assessment });
  });
}

export async function PUT(request: Request, { params }: Context) {
  return handle("PUT /api/games/[id]/assessment", async () => {
    const auth = await requireProfile();
    if (!auth.ok) return auth.response;
    const parsedParams = parseWith(idParamsSchema, await params);
    if (!parsedParams.ok) return parsedParams.response;
    const body = await parseBody(request, saveAssessmentSchema);
    if (!body.ok) return body.response;

    const outcome = await saveAssessment(auth.value, parsedParams.value.id, body.value.state, body.value.version);
    if (outcome.kind === "not-found") return jsonError(404, "Game not found.");
    if (outcome.kind === "conflict") return jsonError(409, CONFLICT_MESSAGE);
    if (outcome.kind === "forbidden") return jsonError(403, outcome.message);
    if (outcome.kind === "invalid") return jsonError(400, outcome.message);
    return NextResponse.json({ version: outcome.version, updatedAt: outcome.updatedAt });
  });
}
