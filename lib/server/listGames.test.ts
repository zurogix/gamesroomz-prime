import { beforeEach, describe, expect, it, vi } from "vitest";
import { discoverySummaryText, teamCounts } from "@/lib/gameDiscoverySummary";

const gameFindMany = vi.fn();
const groupBy = vi.fn();
const responseFindMany = vi.fn();
vi.mock("./db", () => ({ db: { game: { findMany: gameFindMany }, discoveryResponse: { groupBy, findMany: responseFindMany } } }));

const { listGames } = await import("./games");

const at = (iso: string) => new Date(iso);
const game = (id: string) => ({ id, name: `Game ${id}`, updatedAt: at("2026-09-20T10:00:00Z"), assessment: { status: "discovery", updatedAt: at("2026-09-25T10:00:00Z"), updatedBy: { name: "Pat" } } });

describe("games list discovery summary", () => {
  it("reads not started, partial and all submitted", () => {
    const counts = teamCounts([
      { gameId: "partial", status: "submitted", count: 1, lastSubmittedAt: "2026-09-26T12:00:00Z" },
      { gameId: "partial", status: "in-progress", count: 1, lastSubmittedAt: null },
      { gameId: "done", status: "submitted", count: 3, lastSubmittedAt: "2026-09-24T12:00:00Z" },
    ]);
    const text = (id: string) => discoverySummaryText({ kind: "team", ...(counts.get(id) ?? { submitted: 0, total: 0, lastSubmittedAt: null }) });

    expect(text("none")).toBe("Not started");
    expect(text("partial")).toBe("1 of 2 submitted · 26 Sep");
    expect(text("done")).toBe("3 of 3 submitted · 24 Sep");
    expect(discoverySummaryText({ kind: "team", submitted: 0, total: 2, lastSubmittedAt: null })).toBe("0 of 2 submitted");
  });

  it("shows a developer only their own status", () => {
    expect(discoverySummaryText({ kind: "own", status: "in-progress" })).toBe("Your discovery: in progress");
    expect(discoverySummaryText({ kind: "own", status: "submitted" })).toBe("Your discovery: submitted");
  });
});

describe("listGames", () => {
  beforeEach(() => {
    [gameFindMany, groupBy, responseFindMany].forEach((fn) => fn.mockReset());
    gameFindMany.mockResolvedValue([game("g1"), game("g2")]);
    groupBy.mockResolvedValue([
      { gameId: "g1", status: "submitted", _count: { _all: 1 }, _max: { submittedAt: at("2026-09-26T12:00:00Z") } },
      { gameId: "g1", status: "in_progress", _count: { _all: 1 }, _max: { submittedAt: null } },
    ]);
    responseFindMany.mockResolvedValue([{ gameId: "g1", status: "submitted" }]);
  });

  it("gives product the team counts, from a grouped count", async () => {
    const games = await listGames({ id: "pm", role: "product" });

    expect(games.map((g) => g.discovery)).toEqual([
      { kind: "team", submitted: 1, total: 2, lastSubmittedAt: "2026-09-26T12:00:00.000Z" },
      { kind: "team", submitted: 0, total: 0, lastSubmittedAt: null },
    ]);
  });

  it("gives a developer only their own status", async () => {
    const games = await listGames({ id: "dev", role: "developer" });

    expect(games.map((g) => g.discovery)).toEqual([{ kind: "own", status: "submitted" }, { kind: "own", status: null }]);
    expect(JSON.stringify(games)).not.toContain("\"total\"");
  });

  it("never selects answers or the assessment state JSON", async () => {
    await listGames({ id: "pm", role: "product" });
    const calls = JSON.stringify([gameFindMany.mock.calls, groupBy.mock.calls, responseFindMany.mock.calls]);

    expect(calls).not.toContain("answers");
    expect(calls).not.toContain("\"state\"");
    expect(responseFindMany.mock.calls[0][0].select).toEqual({ gameId: true, status: true });
    expect(groupBy.mock.calls[0][0]).toMatchObject({ by: ["gameId", "status"], _count: { _all: true }, _max: { submittedAt: true } });
  });
});
