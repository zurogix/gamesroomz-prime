import { apiRequest } from "@/lib/apiClient";
import { prepareImport } from "@/lib/importDraft";
import type { Role } from "@/lib/permissions";
import { assessmentStateSchema } from "@/lib/schemas/assessment";
import type { AssessmentState } from "@/lib/types";

export type ImportTarget = { kind: "existing"; gameId: string } | { kind: "new"; name: string };
export type ImportResult = { ok: true; gameId: string } | { ok: false; error: string };

async function resolveGameId(target: ImportTarget): Promise<ImportResult> {
  if (target.kind === "existing") return { ok: true, gameId: target.gameId };
  const created = await apiRequest<{ game: { id: string } }>("/api/games", { method: "POST", body: JSON.stringify({ name: target.name }) });
  return created.ok ? { ok: true, gameId: created.data.game.id } : { ok: false, error: created.error };
}

/** Saves a local draft into a game through the normal API (validation, permissions, versioning). */
export async function importToGame(draft: AssessmentState, target: ImportTarget, role: Role): Promise<ImportResult> {
  const game = await resolveGameId(target);
  if (!game.ok) return game;
  const loaded = await apiRequest<{ assessment: { state: AssessmentState; version: number } }>(`/api/games/${game.gameId}/assessment`);
  if (!loaded.ok) return { ok: false, error: loaded.error };

  const prepared = assessmentStateSchema.safeParse(prepareImport(draft, loaded.data.assessment.state, role));
  if (!prepared.success) return { ok: false, error: "The draft in this browser could not be read." };
  const saved = await apiRequest(`/api/games/${game.gameId}/assessment`, {
    method: "PUT",
    body: JSON.stringify({ state: prepared.data, version: loaded.data.assessment.version }),
  });
  return saved.ok ? { ok: true, gameId: game.gameId } : { ok: false, error: saved.error };
}
