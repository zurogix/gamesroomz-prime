import { DISCOVERY_SECTIONS } from "./discovery";
import type { Role } from "./permissions";
import { FINDINGS, OVERVIEW, PLAN, SUMMARY } from "./sections";
import type { AssessmentStatus } from "./types";

/** In workflow order. The first one is the default for new and older assessments. */
export const STATUSES: { value: AssessmentStatus; label: string }[] = [
  { value: "discovery", label: "Discovery in progress" },
  { value: "discovery-submitted", label: "Discovery submitted — under review" },
  { value: "findings", label: "Findings & options — open for comments" },
  { value: "plan", label: "Conversion plan in progress" },
  { value: "plan-submitted", label: "Plan submitted — under review" },
  { value: "agreed", label: "Plan agreed" },
];

export const DEFAULT_STATUS: AssessmentStatus = "discovery";

export const statusLabel = (status: AssessmentStatus) => STATUSES.find((s) => s.value === status)?.label ?? status;

/** Any value that is not a current status (e.g. "draft" or "planning" from older saves) starts again at discovery. */
export function hydrateStatus(value: unknown): AssessmentStatus {
  return STATUSES.find((s) => s.value === value)?.value ?? DEFAULT_STATUS;
}

const statusIndex = (status: AssessmentStatus) => STATUSES.findIndex((s) => s.value === status);

export type StageId = "discovery" | "findings" | "plan" | "summary";

export type Stage = {
  id: StageId;
  number: number;
  title: string;
  who: string;
  /** The first status in which the stage is open. */
  opensAt: AssessmentStatus;
  /** The view the progress line opens. */
  view: string;
};

export const STAGES: Stage[] = [
  { id: "discovery", number: 1, title: "Discovery", who: "Developer", opensAt: "discovery", view: DISCOVERY_SECTIONS[0].title },
  { id: "findings", number: 2, title: "Findings & options", who: "Product publishes · developer responds", opensAt: "findings", view: FINDINGS },
  { id: "plan", number: 3, title: "Conversion plan", who: "Pre-filled · developer confirms", opensAt: "plan", view: PLAN },
  { id: "summary", number: 4, title: "Summary", who: "Everyone reads", opensAt: "agreed", view: SUMMARY },
];

export const stageById = (id: StageId) => STAGES.find((s) => s.id === id)!;

const CURRENT_STAGE: Record<AssessmentStatus, StageId> = {
  discovery: "discovery",
  "discovery-submitted": "discovery",
  findings: "findings",
  plan: "plan",
  "plan-submitted": "plan",
  agreed: "summary",
};

export const currentStage = (status: AssessmentStatus) => stageById(CURRENT_STAGE[status]);

/** Which stage a view belongs to; the Overview belongs to none. */
export function stageForView(view: string): Stage | null {
  if (view === OVERVIEW) return null;
  if (DISCOVERY_SECTIONS.some((s) => s.title === view)) return stageById("discovery");
  return STAGES.find((s) => s.view === view) ?? null;
}

/** True once the workflow has reached the stage. */
export const stageReached = (stage: Stage, status: AssessmentStatus) => statusIndex(status) >= statusIndex(stage.opensAt);

/**
 * Whether a stage is shown at all. Stages the workflow has not reached are hidden, except for
 * product with "Preview upcoming stages" switched on.
 */
export const stageOpen = (role: Role, stage: Stage, status: AssessmentStatus, previewUpcoming = false) =>
  stageReached(stage, status) || (role === "product" && previewUpcoming);

/** The stages to show in navigation, in order. Developers only ever get stages that are open. */
export const navigableStages = (role: Role, status: AssessmentStatus, previewUpcoming = false) =>
  STAGES.filter((stage) => stageOpen(role, stage, status, previewUpcoming));

/** An upcoming stage product has chosen to preview. */
export const isPreview = (role: Role, stage: Stage, status: AssessmentStatus, previewUpcoming = false) =>
  !stageReached(stage, status) && stageOpen(role, stage, status, previewUpcoming);

/** Whether a view may be shown; views outside any stage (the Overview) always may. */
export function viewOpen(view: string, role: Role, status: AssessmentStatus, previewUpcoming = false) {
  const stage = stageForView(view);
  return stage === null || stageOpen(role, stage, status, previewUpcoming);
}

export type StageProgress = "done" | "current" | "upcoming";

export function stageProgress(stage: Stage, status: AssessmentStatus): StageProgress {
  const current = currentStage(status).number;
  if (stage.number < current) return "done";
  if (stage.number === current) return "current";
  return "upcoming";
}

export const WHAT_HAPPENS_NEXT =
  "Thanks. The product team will review your answers. You'll then see a summary of findings and possible approaches to comment on. We may ask a few follow-up questions or arrange a short walkthrough.";
