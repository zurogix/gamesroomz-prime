import { DiscoveryStatus as DbDiscoveryStatus, Prisma } from "@prisma/client";
import { discoveryInfoFor, GameDiscoveryInfo, ResponseGroup, teamCounts } from "@/lib/gameDiscoverySummary";
import type { Role } from "@/lib/permissions";
import type { DiscoveryStatus } from "@/lib/responses";
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
  discovery: GameDiscoveryInfo;
};

type GameRow = Prisma.GameGetPayload<{ select: typeof GAME_LIST_SELECT }>;

export type LoadedAssessment = {
  gameId: string;
  gameName: string;
  state: AssessmentState;
  version: number;
  updatedAt: string;
  updatedBy: string;
};

const active = { deletedAt: null };

/** Active responses per game and status, counted in the database: no answers are loaded. */
async function responseGroups(): Promise<ResponseGroup[]> {
  const groups = await db.discoveryResponse.groupBy({
    by: ["gameId", "status"],
    where: active,
    _count: { _all: true },
    _max: { submittedAt: true },
  });
  return groups.map((g) => ({
    gameId: g.gameId,
    status: g.status === DbDiscoveryStatus.submitted ? "submitted" : "in-progress",
    count: g._count._all,
    lastSubmittedAt: g._max.submittedAt?.toISOString() ?? null,
  }));
}

/** The viewer's own response status per game (developers; product has none). */
async function ownStatuses(viewerId: string): Promise<Map<string, DiscoveryStatus>> {
  const rows = await db.discoveryResponse.findMany({ where: { profileId: viewerId, ...active }, select: { gameId: true, status: true } });
  return new Map(rows.map((r) => [r.gameId, r.status === DbDiscoveryStatus.submitted ? "submitted" : "in-progress"]));
}

export type GameListData = { rows: GameRow[]; groups: ResponseGroup[]; own: Map<string, DiscoveryStatus> };

/**
 * Everything the games list needs, in parallel, for the signed-in user (identity id = profile id).
 * Run alongside the profile check; turn into summaries with toGameSummaries once the role is known.
 */
export async function loadGameList(viewerId: string): Promise<GameListData> {
  const [rows, groups, own] = await Promise.all([
    db.game.findMany({ where: active, orderBy: { updatedAt: "desc" }, select: GAME_LIST_SELECT }),
    responseGroups(),
    ownStatuses(viewerId),
  ]);
  return { rows, groups, own };
}

/** One summary per game; team counts go to product only, a developer sees only their own status. */
export function toGameSummaries(data: GameListData, role: Role): GameSummary[] {
  const counts = teamCounts(data.groups);
  return data.rows.map((g) => ({
    id: g.id,
    name: g.name,
    status: g.assessment ? fromDbStatus(g.assessment.status) : DEFAULT_STATUS,
    updatedAt: (g.assessment?.updatedAt ?? g.updatedAt).toISOString(),
    updatedBy: g.assessment?.updatedBy.name ?? "",
    discovery: discoveryInfoFor(role, counts.get(g.id), data.own.get(g.id) ?? null),
  }));
}

export async function listGames(viewer: { id: string; role: Role }): Promise<GameSummary[]> {
  return toGameSummaries(await loadGameList(viewer.id), viewer.role);
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
  return { id: game.id, name: game.name, status: state.status, updatedAt: game.updatedAt.toISOString(), updatedBy: profile.name, discovery: discoveryInfoFor(profile.role, undefined, null) };
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
