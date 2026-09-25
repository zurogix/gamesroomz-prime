import { Prisma } from "@prisma/client";
import { hydrateAssessment } from "@/lib/assessment";
import { AnswerMap, hydrateAnswers } from "@/lib/discoveryAnswers";
import type { AssessmentState, AssessmentStatus } from "@/lib/types";
import { db } from "./db";
import { fromDbStatus } from "./statusMap";

export type SnapshotEntry = {
  id: string;
  createdAt: string;
  status: AssessmentStatus;
  createdBy: string;
  note: string | null;
  state: AssessmentState;
  /** Discovery answers saved inside versions from before answers were kept per developer (else empty). */
  answers: AnswerMap;
};

const HISTORY_LIMIT = 50;

/** Saved versions for a game, newest first. Null when the game does not exist. */
export async function listSnapshots(gameId: string): Promise<SnapshotEntry[] | null> {
  const assessment = await db.assessment.findFirst({ where: { gameId, deletedAt: null, game: { deletedAt: null } }, select: { id: true } });
  if (!assessment) return null;
  const rows = await db.assessmentSnapshot.findMany({
    where: { assessmentId: assessment.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
    include: { createdBy: { select: { name: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    status: fromDbStatus(r.status),
    createdBy: r.createdBy.name,
    note: r.note,
    state: { ...hydrateAssessment(r.state as Prisma.JsonObject), status: fromDbStatus(r.status) },
    answers: hydrateAnswers((r.state as Prisma.JsonObject).answers),
  }));
}
