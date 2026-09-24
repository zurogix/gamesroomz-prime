import { AssessmentState, Classification } from "./types";

export type ImpactClass = Exclude<Classification, "">;

export const OVERVIEW = "Overview";
export const PLAN = "Conversion Plan";
export const SUMMARY = "Management Summary";

export const ASSESSMENT_SECTIONS = [
  "Project Health",
  "Unity & Android",
  "Core Gameplay",
  "PvP Architecture",
  "Multiplayer Engine 2.0",
  "Multi-Touch & Input",
  "Prime 16:9 UI",
  "Gamesroomz Integration",
  "Prime Hardware & QA",
];

export const CLASSES: ImpactClass[] = ["reuse", "extend", "refactor", "rewrite", "new", "remove"];

/** Classifications offered for the existing multiplayer engine. */
export const ENGINE_CLASSES: ImpactClass[] = ["reuse", "extend", "refactor", "rewrite"];

export const CLASS_LABEL: Record<ImpactClass, string> = {
  reuse: "Reuse",
  extend: "Extend",
  refactor: "Refactor",
  rewrite: "Rewrite",
  new: "New",
  remove: "Remove",
};

/** Defined by what happens to the EXISTING code. */
export const CLASS_HELP: Record<ImpactClass, string> = {
  reuse: "Used as it is. Settings/config changes at most.",
  extend: "Existing code stays the same inside; new code is added around it (e.g. a new input provider or adapter).",
  refactor: "Existing code is reorganized inside but does the same job; its logic is kept.",
  rewrite: "Existing code is thrown away and written again; the old code is only a reference.",
  new: "Nothing like this exists in the game today.",
  remove: "A mobile-only feature is taken out (ads, mobile IAP, social login).",
};

export const RECOMMENDED_PATH_LABEL = {
  shared: "Shared Multiplayer Engine 2.0",
  separate: "Separate Prime Multiplayer Engine",
} as const;

export const ANSWERS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Not sure" },
] as const;

export const STATUS_STEPS: { value: AssessmentState["status"]; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "assessment-complete", label: "Assessment complete" },
  { value: "planning", label: "Planning" },
  { value: "submitted", label: "Submitted for review" },
  { value: "changes-requested", label: "Changes requested" },
  { value: "approved", label: "Approved" },
];

export const CONFIRMATIONS = [
  "The assessment accurately describes the existing game architecture.",
  "All items classified as Rewrite/New include a technical reason and implementation approach.",
  "Optional enhancements are separated from mandatory Prime conversion work.",
  "Person-day estimates include implementation and developer testing assumptions.",
  "The Multiplayer Engine 2.0 assessment compares a shared-core path with a separate Prime engine and documents the technical evidence behind the recommended path.",
];

export const COMPLEXITY_BANDS = ["Minor", "Moderate", "Major", "Rebuild"];

export function riskColor(risk: string) {
  if (risk === "high") return "var(--risk-high)";
  if (risk === "medium") return "var(--risk-med)";
  return "var(--risk-low)";
}

export function formatDays(n: number) {
  return (Math.round((Number(n) || 0) * 10) / 10).toString();
}
