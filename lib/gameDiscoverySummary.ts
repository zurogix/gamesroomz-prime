import type { Role } from "./permissions";
import type { DiscoveryStatus } from "./responses";

/** The games list's Discovery column: product sees the whole team, a developer their own response. */
export type GameDiscoveryInfo =
  | { kind: "team"; submitted: number; total: number; lastSubmittedAt: string | null }
  | { kind: "own"; status: DiscoveryStatus | null };

/** Per game, from a grouped count of active responses (never the answers themselves). */
export type TeamCounts = { submitted: number; total: number; lastSubmittedAt: string | null };

export type ResponseGroup = { gameId: string; status: DiscoveryStatus; count: number; lastSubmittedAt: string | null };

/** Folds rows grouped by (game, status) into submitted / total counts and the latest submission. */
export function teamCounts(groups: ResponseGroup[]): Map<string, TeamCounts> {
  return groups.reduce((map, g) => {
    const current = map.get(g.gameId) ?? { submitted: 0, total: 0, lastSubmittedAt: null };
    const submitted = g.status === "submitted";
    const latest = [current.lastSubmittedAt, submitted ? g.lastSubmittedAt : null].filter((d): d is string => Boolean(d)).sort().at(-1) ?? null;
    return map.set(g.gameId, {
      submitted: current.submitted + (submitted ? g.count : 0),
      total: current.total + g.count,
      lastSubmittedAt: latest,
    });
  }, new Map<string, TeamCounts>());
}

/** What each role may see: team counts only for product, their own status only for developers. */
export function discoveryInfoFor(role: Role, team: TeamCounts | undefined, own: DiscoveryStatus | null): GameDiscoveryInfo {
  if (role === "developer") return { kind: "own", status: own };
  return { kind: "team", ...(team ?? { submitted: 0, total: 0, lastSubmittedAt: null }) };
}

/** "26 Sep": day then three-letter month (some locales write "Sept"). */
function shortDate(iso: string) {
  const date = new Date(iso);
  return `${date.getDate()} ${date.toLocaleDateString("en-US", { month: "short" })}`;
}

const OWN_TEXT: Record<DiscoveryStatus, string> = { "in-progress": "in progress", submitted: "submitted" };

/** e.g. "1 of 2 submitted · 26 Sep", "Not started", or "Your discovery: submitted". */
export function discoverySummaryText(info: GameDiscoveryInfo): string {
  if (info.kind === "own") return `Your discovery: ${info.status ? OWN_TEXT[info.status] : "not started"}`;
  if (info.total === 0) return "Not started";
  const date = info.lastSubmittedAt ? ` · ${shortDate(info.lastSubmittedAt)}` : "";
  return `${info.submitted} of ${info.total} submitted${date}`;
}
