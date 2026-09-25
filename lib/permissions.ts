import { ENGINE_WORKSTREAM_ID } from "./engine";
import { statusLabel } from "./stages";
import type { AssessmentState, AssessmentStatus, Workstream } from "./types";

export type Role = "product" | "developer";

/**
 * The parts of the shared assessment that are edited separately. Discovery answers are not part of it:
 * each developer has their own response (rules in lib/responses.ts).
 */
export type Area = "developerTeam" | "engine" | "plan" | "checks";

export const ALL_AREAS: Area[] = ["developerTeam", "engine", "plan", "checks"];

export const isProduct = (role: Role) => role === "product";

/** Developers submit discovery per response, not as a game status change. */
const DEVELOPER_TRANSITIONS: Partial<Record<AssessmentStatus, AssessmentStatus[]>> = {
  plan: ["plan-submitted"],
};

/** "Publish findings" (discovery → findings) also needs a submitted response; see publishFindingsRefusal. */
const PRODUCT_TRANSITIONS: Partial<Record<AssessmentStatus, AssessmentStatus[]>> = {
  discovery: ["findings"],
  findings: ["plan"],
  "plan-submitted": ["agreed", "plan"],
  agreed: ["plan"],
};

/** The statuses this role may move the assessment to from its current status. */
export function allowedTransitions(role: Role, from: AssessmentStatus): AssessmentStatus[] {
  const table = isProduct(role) ? PRODUCT_TRANSITIONS : DEVELOPER_TRANSITIONS;
  return table[from] ?? [];
}

const DEVELOPER_AREAS: Record<AssessmentStatus, Area[]> = {
  discovery: ["developerTeam"],
  findings: ["engine"],
  plan: ["engine", "plan", "checks"],
  "plan-submitted": [],
  agreed: [],
};

/** What this role may change while the assessment is in this status. Product may change everything. */
export function editableAreas(role: Role, status: AssessmentStatus): Area[] {
  return isProduct(role) ? ALL_AREAS : DEVELOPER_AREAS[status];
}

export const canEdit = (role: Role, status: AssessmentStatus, area: Area) => editableAreas(role, status).includes(area);

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

/** Engine 2.0 days and risk follow the engine comparison, so they are not plan edits. */
function planWithoutDerived(plan: Workstream[]) {
  return plan.map((w) => (w.id === ENGINE_WORKSTREAM_ID ? { ...w, personDays: 0, risk: "" } : w));
}

const AREA_VALUE: Record<Area, (s: AssessmentState) => unknown> = {
  developerTeam: (s) => s.gameInfo.developer,
  engine: (s) => s.engineAssessment,
  plan: (s) => planWithoutDerived(s.plan),
  checks: (s) => s.checks,
};

/** The areas that differ between two states. The game name is owned by the Game record and ignored. */
export function changedAreas(previous: AssessmentState, next: AssessmentState): Area[] {
  return ALL_AREAS.filter((area) => stableStringify(AREA_VALUE[area](previous)) !== stableStringify(AREA_VALUE[area](next)));
}

const LOCKED_MESSAGE: Record<Area, string> = {
  developerTeam: "The developer / team can only be changed while discovery is in progress.",
  engine: "The engine comparison can only be changed while findings or the plan are open.",
  plan: "The conversion plan can only be changed while the plan is in progress.",
  checks: "The confirmations can only be changed while the plan is in progress.",
};

export const SUBMIT_PLAN_NEEDS_CHECKS = "Tick every confirmation before submitting the plan.";

function transitionError(role: Role, from: AssessmentStatus, next: AssessmentState): string | null {
  if (from === next.status) return null;
  if (!allowedTransitions(role, from).includes(next.status)) {
    return `You can't move this assessment from "${statusLabel(from)}" to "${statusLabel(next.status)}".`;
  }
  if (next.status === "plan-submitted" && !next.checks.every(Boolean)) return SUBMIT_PLAN_NEEDS_CHECKS;
  return null;
}

/**
 * Returns why a save is not allowed for this role, or null when it is. Edits are checked against the
 * stored status, so a developer can make a last change and submit in the same save.
 */
export function assessmentChangeError(role: Role, previous: AssessmentState, next: AssessmentState): string | null {
  const allowed = editableAreas(role, previous.status);
  const locked = changedAreas(previous, next).find((area) => !allowed.includes(area));
  if (locked) return LOCKED_MESSAGE[locked];
  return transitionError(role, previous.status, next);
}
