import { Prisma } from "@prisma/client";
import { hydrateAssessment, initialAssessment } from "@/lib/assessment";
import { DEFAULT_STATUS } from "@/lib/stages";
import type { AssessmentState, AssessmentStatus } from "@/lib/types";
import { db } from "./db";
import { GAME_LIST_SELECT } from "./gameListSelect";
import { fromDbStatus, toDbStatus } from "./statusMap";
import type { SessionProfile } from "./auth";

export type GameSummary = {
  id: string;
  name: string;
  status: AssessmentStatus;
  updatedAt: string;
  updatedBy: string;
};

export type LoadedAssessment = {
  gameId: string;
  gameName: string;
  state: AssessmentState;
  version: number;
  updatedAt: string;
  updatedBy: string;
};

const active = { deletedAt: null };

export async function listGames(): Promise<GameSummary[]> {
  const games = await db.game.findMany({
    where: active,
    orderBy: { updatedAt: "desc" },
    select: GAME_LIST_SELECT,
  });
  return games.map((g) => ({
    id: g.id,
    name: g.name,
    status: g.assessment ? fromDbStatus(g.assessment.status) : DEFAULT_STATUS,
    updatedAt: (g.assessment?.updatedAt ?? g.updatedAt).toISOString(),
    updatedBy: g.assessment?.updatedBy.name ?? "",
  }));
}

/** Creates the game with an empty assessment named after it. */
export async function createGame(profile: SessionProfile, name: string): Promise<GameSummary> {
  const state = { ...initialAssessment(), gameInfo: { ...initialAssessment().gameInfo, gameName: name } };
  const game = await db.game.create({
    data: {
      name,
      createdById: profile.id,
      assessment: {
        create: { state: state as Prisma.InputJsonValue, status: toDbStatus(state.status), updatedById: profile.id },
      },
    },
  });
  return { id: game.id, name: game.name, status: state.status, updatedAt: game.updatedAt.toISOString(), updatedBy: profile.name };
}

export async function findActiveGame(id: string) {
  return db.game.findFirst({ where: { id, ...active } });
}

export async function renameGame(id: string, name: string) {
  return db.game.update({ where: { id }, data: { name } });
}

/** Soft delete: the game and its assessment are hidden, never removed. */
export async function softDeleteGame(id: string) {
  const now = new Date();
  await db.$transaction([
    db.assessment.updateMany({ where: { gameId: id, ...active }, data: { deletedAt: now } }),
    db.game.update({ where: { id }, data: { deletedAt: now } }),
  ]);
}

export async function loadAssessment(gameId: string): Promise<LoadedAssessment | null> {
  const row = await db.assessment.findFirst({
    where: { gameId, ...active, game: active },
    include: { game: { select: { name: true } }, updatedBy: { select: { name: true } } },
  });
  if (!row) return null;
  // The game name is owned by the Game record and the status column is the source of truth;
  // older stored states are filled in by hydration.
  const hydrated = hydrateAssessment(row.state as Prisma.JsonObject);
  const state = { ...hydrated, status: fromDbStatus(row.status), gameInfo: { ...hydrated.gameInfo, gameName: row.game.name } };
  return {
    gameId,
    gameName: row.game.name,
    state,
    version: row.version,
    updatedAt: row.updatedAt.toISOString(),
    updatedBy: row.updatedBy.name,
  };
}
