import type { AssessmentState, AssessmentStatus } from "./types";

export type Role = "product" | "developer";

const DEVELOPER_STATUSES: AssessmentStatus[] = ["draft", "assessment-complete", "planning", "submitted"];
const ALL_STATUSES: AssessmentStatus[] = [...DEVELOPER_STATUSES, "changes-requested", "agreed"];

export const isProduct = (role: Role) => role === "product";

/** Statuses a role may set. Product may set every status. */
export function allowedStatuses(role: Role): AssessmentStatus[] {
  return isProduct(role) ? ALL_STATUSES : DEVELOPER_STATUSES;
}

export function canEditPrimeTargets(role: Role) {
  return isProduct(role);
}

/** Creating, renaming and removing games, and managing the team, are product-only. */
export function canManageGames(role: Role) {
  return isProduct(role);
}

export function canManageTeam(role: Role) {
  return isProduct(role);
}

/** Key-order-independent JSON, so reordered but equal objects compare equal. */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/**
 * Returns why a save is not allowed for this role, or null when it is.
 * Only changes are checked: a developer may keep saving an assessment that product marked "agreed".
 */
export function assessmentChangeError(role: Role, previous: AssessmentState, next: AssessmentState): string | null {
  const targetsChanged = stableStringify(previous.primeTargets) !== stableStringify(next.primeTargets);
  if (targetsChanged && !canEditPrimeTargets(role)) return "Only the product team can change the Prime targets.";
  const statusChanged = previous.status !== next.status;
  if (statusChanged && !allowedStatuses(role).includes(next.status)) {
    return `Only the product team can set the status to "${next.status}".`;
  }
  return null;
}
