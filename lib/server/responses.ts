import { DiscoveryStatus as DbDiscoveryStatus, Prisma } from "@prisma/client";
import { hydrateAnswers, type AnswerMap } from "@/lib/discoveryAnswers";
import type { DiscoveryResponseData, DiscoveryStatus } from "@/lib/responses";
import type { AssessmentStatus } from "@/lib/types";
import { db } from "./db";
import { fromDbStatus } from "./statusMap";

const active = { deletedAt: null };

const TO_DB: Record<DiscoveryStatus, DbDiscoveryStatus> = {
  "in-progress": DbDiscoveryStatus.in_progress,
  submitted: DbDiscoveryStatus.submitted,
};
const fromDb = (status: DbDiscoveryStatus): DiscoveryStatus => (status === DbDiscoveryStatus.submitted ? "submitted" : "in-progress");

const withDeveloper = { profile: { select: { name: true } } } satisfies Prisma.DiscoveryResponseInclude;
type ResponseRow = Prisma.DiscoveryResponseGetPayload<{ include: typeof withDeveloper }>;

function toData(row: ResponseRow): DiscoveryResponseData {
  return {
    id: row.id,
    profileId: row.profileId,
    developerName: row.profile.name,
    status: fromDb(row.status),
    submittedAt: row.submittedAt?.toISOString() ?? null,
    answers: hydrateAnswers(row.answers),
    version: row.version,
  };
}

/** The game's status (from the status column), or null when the game does not exist or was removed. */
export async function findGameStatus(gameId: string): Promise<AssessmentStatus | null> {
  const row = await db.assessment.findFirst({ where: { gameId, ...active, game: active }, select: { status: true } });
  return row ? fromDbStatus(row.status) : null;
}

async function findOwn(gameId: string, profileId: string) {
  return db.discoveryResponse.findFirst({ where: { gameId, profileId, ...active }, include: withDeveloper });
}

const isUniqueViolation = (err: unknown) => err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";

/**
 * The developer's active response, created empty on first access. Two first requests may race; the
 * partial unique index lets only one insert win and the other reads it.
 */
export async function getOrCreateOwnResponse(gameId: string, profileId: string): Promise<DiscoveryResponseData> {
  const existing = await findOwn(gameId, profileId);
  if (existing) return toData(existing);
  try {
    const created = await db.discoveryResponse.create({ data: { gameId, profileId, answers: {} }, include: withDeveloper });
    return toData(created);
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
    const raced = await findOwn(gameId, profileId);
    if (!raced) throw err;
    return toData(raced);
  }
}

export async function findResponse(gameId: string, responseId: string): Promise<DiscoveryResponseData | null> {
  const row = await db.discoveryResponse.findFirst({ where: { id: responseId, gameId, ...active }, include: withDeveloper });
  return row ? toData(row) : null;
}

/** Every active response for the game, by developer name. For the product team. */
export async function listResponses(gameId: string): Promise<DiscoveryResponseData[]> {
  const rows = await db.discoveryResponse.findMany({ where: { gameId, ...active }, include: withDeveloper, orderBy: { profile: { name: "asc" } } });
  return rows.map(toData);
}

export async function countSubmittedResponses(gameId: string): Promise<number> {
  return db.discoveryResponse.count({ where: { gameId, ...active, status: DbDiscoveryStatus.submitted } });
}

export type SaveAnswersOutcome = { kind: "saved"; version: number; updatedAt: string } | { kind: "conflict" };

/** Saves answers only if they were based on the stored version; the check is part of the update. */
export async function saveAnswers(responseId: string, answers: AnswerMap, version: number): Promise<SaveAnswersOutcome> {
  const updated = await db.discoveryResponse.updateMany({
    where: { id: responseId, version, ...active, status: DbDiscoveryStatus.in_progress },
    data: { answers: answers as Prisma.InputJsonValue, version: { increment: 1 } },
  });
  if (updated.count === 0) return { kind: "conflict" };
  const saved = await db.discoveryResponse.findUniqueOrThrow({ where: { id: responseId }, select: { version: true, updatedAt: true } });
  return { kind: "saved", version: saved.version, updatedAt: saved.updatedAt.toISOString() };
}

export async function markSubmitted(responseId: string): Promise<DiscoveryResponseData> {
  const row = await db.discoveryResponse.update({
    where: { id: responseId },
    data: { status: DbDiscoveryStatus.submitted, submittedAt: new Date() },
    include: withDeveloper,
  });
  return toData(row);
}

export async function reopenResponse(responseId: string): Promise<DiscoveryResponseData> {
  const row = await db.discoveryResponse.update({
    where: { id: responseId },
    data: { status: TO_DB["in-progress"], submittedAt: null },
    include: withDeveloper,
  });
  return toData(row);
}

/** Soft delete: the answers stay in the database; the developer starts with a blank form next time. */
export async function removeResponse(responseId: string) {
  await db.discoveryResponse.update({ where: { id: responseId }, data: { deletedAt: new Date() } });
}
