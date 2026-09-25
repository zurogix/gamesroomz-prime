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
  /** The first status in which developers can see the stage. */
  opensAt: AssessmentStatus;
  /** Shown to developers instead of the content while the stage is locked. */
  lockedMessage: string;
  /** The view the stepper opens. */
  view: string;
};

export const STAGES: Stage[] = [
  { id: "discovery", number: 1, title: "Discovery (A–I)", who: "Developer", opensAt: "discovery", lockedMessage: "", view: DISCOVERY_SECTIONS[0].title },
  {
    id: "findings",
    number: 2,
    title: "Findings & options",
    who: "Product publishes · developer responds",
    opensAt: "findings",
    lockedMessage: "Opens after the product team has reviewed your discovery answers. You'll see findings and possible approaches here to comment on.",
    view: FINDINGS,
  },
  {
    id: "plan",
    number: 3,
    title: "Conversion plan",
    who: "Pre-filled · developer confirms",
    opensAt: "plan",
    lockedMessage: "Opens after the findings and options are agreed. It will be pre-filled with suggested workstreams for you to confirm or edit.",
    view: PLAN,
  },
  { id: "summary", number: 4, title: "Summary", who: "Everyone reads", opensAt: "agreed", lockedMessage: "Opens once the plan is agreed.", view: SUMMARY },
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

/** Product can open every stage at any time; developers only stages that have been reached. */
export const stageVisible = (role: Role, stage: Stage, status: AssessmentStatus) => role === "product" || stageReached(stage, status);

/** Product looking at a stage the workflow has not reached yet. */
export const isPreview = (role: Role, stage: Stage, status: AssessmentStatus) => role === "product" && !stageReached(stage, status);

export type StageProgress = "done" | "current" | "locked";

export function stageProgress(stage: Stage, status: AssessmentStatus): StageProgress {
  const current = currentStage(status).number;
  if (stage.number < current) return "done";
  if (stage.number === current) return "current";
  return "locked";
}

export const WHAT_HAPPENS_NEXT =
  "Thanks. The product team will review your answers. You'll then see a summary of findings and possible approaches to comment on. We may ask a few follow-up questions or arrange a short walkthrough.";
