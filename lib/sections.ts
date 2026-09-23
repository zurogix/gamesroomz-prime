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
  "Multi-Touch & Input",
  "Prime 16:9 UI",
  "Gamesroomz Integration",
  "Prime Hardware & QA",
];

export const CLASSES: ImpactClass[] = ["reuse", "modify", "rewrite", "new", "na"];

export const CLASS_LABEL: Record<ImpactClass, string> = {
  reuse: "Reuse",
  modify: "Modify",
  rewrite: "Rewrite",
  new: "New",
  na: "Not applicable",
};

export const CLASS_HELP: Record<ImpactClass, string> = {
  reuse: "Existing implementation can remain substantially unchanged.",
  modify: "Existing implementation is usable but requires changes.",
  rewrite: "An identified existing component must be replaced. Name it and explain why modification is insufficient; this is not a whole-game verdict.",
  new: "This required capability does not exist and must be added. Existing gameplay may still be reused.",
  na: "This requirement is outside the agreed Prime scope. Explain why.",
};

export const ANSWERS = [
  { value: "unsure", label: "Needs investigation" },
  { value: "awaiting", label: "Awaiting specification" },
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
  "Every required change has a specific reason, implementation approach and acceptance outcome.",
  "Optional enhancements are separated from mandatory Prime conversion work.",
  "Effort is counted once per workstream; implementation, testing and dependencies are documented.",
];


export function riskColor(risk: string) {
  if (risk === "high") return "var(--risk-high)";
  if (risk === "medium") return "var(--risk-med)";
  return risk === "low" ? "var(--risk-low)" : "var(--muted)";
}

export function formatDays(n: number | null) {
  if (n === null) return "—";
  return (Math.round((Number(n) || 0) * 10) / 10).toString();
}

