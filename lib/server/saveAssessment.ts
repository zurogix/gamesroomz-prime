import { Prisma } from "@prisma/client";
import { hydrateAssessment } from "@/lib/assessment";
import { assessmentChangeError } from "@/lib/permissions";
import type { AssessmentState } from "@/lib/types";
import { isVersionConflict } from "@/lib/versioning";
import type { SessionProfile } from "./auth";
import { db } from "./db";
import { toDbStatus } from "./statusMap";

export type SaveOutcome =
  | { kind: "saved"; version: number; updatedAt: string }
  | { kind: "conflict" }
  | { kind: "forbidden"; message: string }
  | { kind: "not-found" };

/**
 * Saves a full state if it was based on the stored version and the role may make the change.
 * The version check is repeated inside the update so two concurrent saves cannot both win.
 */
export async function saveAssessment(profile: SessionProfile, gameId: string, state: AssessmentState, version: number): Promise<SaveOutcome> {
  const row = await db.assessment.findFirst({
    where: { gameId, deletedAt: null, game: { deletedAt: null } },
    include: { game: { select: { name: true } } },
  });
  if (!row) return { kind: "not-found" };
  if (isVersionConflict(row.version, version)) return { kind: "conflict" };

  const previous = hydrateAssessment(row.state as Prisma.JsonObject);
  const forbidden = assessmentChangeError(profile.role, previous, state);
  if (forbidden) return { kind: "forbidden", message: forbidden };

  const next = { ...state, gameInfo: { ...state.gameInfo, gameName: row.game.name } };
  return db.$transaction(async (tx): Promise<SaveOutcome> => {
    const updated = await tx.assessment.updateMany({
      where: { id: row.id, version },
      data: { state: next as Prisma.InputJsonValue, status: toDbStatus(next.status), version: { increment: 1 }, updatedById: profile.id },
    });
    if (updated.count === 0) return { kind: "conflict" };
    const saved = await tx.assessment.findUniqueOrThrow({ where: { id: row.id }, select: { version: true, updatedAt: true } });
    return { kind: "saved", version: saved.version, updatedAt: saved.updatedAt.toISOString() };
  });
}
