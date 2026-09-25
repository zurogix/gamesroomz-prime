import { Prisma } from "@prisma/client";
import { hydrateAssessment } from "@/lib/assessment";
import { assessmentChangeError } from "@/lib/permissions";
import { withTransitionEffects } from "@/lib/stageActions";
import type { AssessmentState } from "@/lib/types";
import { isVersionConflict } from "@/lib/versioning";
import type { SessionProfile } from "./auth";
import { db } from "./db";
import { fromDbStatus, toDbStatus } from "./statusMap";

export type SaveOutcome =
  | { kind: "saved"; version: number; updatedAt: string }
  | { kind: "conflict" }
  | { kind: "forbidden"; message: string }
  | { kind: "not-found" };

/**
 * Saves a full state if it was based on the stored version and the role may make the change.
 * The version check is repeated inside the update so two concurrent saves cannot both win,
 * and a status change writes a snapshot in the same transaction. Changes outside the role's
 * editable areas for the stored status, and status changes that are not allowed, are rejected.
 */
export async function saveAssessment(profile: SessionProfile, gameId: string, state: AssessmentState, version: number): Promise<SaveOutcome> {
  const row = await db.assessment.findFirst({
    where: { gameId, deletedAt: null, game: { deletedAt: null } },
    include: { game: { select: { name: true } } },
  });
  if (!row) return { kind: "not-found" };
  if (isVersionConflict(row.version, version)) return { kind: "conflict" };

  // The status column, not the status inside the saved JSON, decides what may change.
  const previous = { ...hydrateAssessment(row.state as Prisma.JsonObject), status: fromDbStatus(row.status) };
  const forbidden = assessmentChangeError(profile.role, previous, state);
  if (forbidden) return { kind: "forbidden", message: forbidden };

  // Transition side effects (e.g. clearing confirmations on "Request changes") are applied here too,
  // so they hold whichever client made the change.
  const effective = withTransitionEffects(previous.status, state);
  const next = { ...effective, gameInfo: { ...effective.gameInfo, gameName: row.game.name } };
  return db.$transaction(async (tx): Promise<SaveOutcome> => {
    const updated = await tx.assessment.updateMany({
      where: { id: row.id, version },
      data: { state: next as Prisma.InputJsonValue, status: toDbStatus(next.status), version: { increment: 1 }, updatedById: profile.id },
    });
    if (updated.count === 0) return { kind: "conflict" };
    // A status change records a saved version of the state as it was saved.
    if (previous.status !== next.status) {
      await tx.assessmentSnapshot.create({
        data: { assessmentId: row.id, status: toDbStatus(next.status), state: next as Prisma.InputJsonValue, createdById: profile.id },
      });
    }
    const saved = await tx.assessment.findUniqueOrThrow({ where: { id: row.id }, select: { version: true, updatedAt: true } });
    return { kind: "saved", version: saved.version, updatedAt: saved.updatedAt.toISOString() };
  });
}
