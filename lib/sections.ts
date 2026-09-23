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

export const CLASSES: ImpactClass[] = ["reuse", "modify", "rewrite", "new"];

export const CLASS_LABEL: Record<ImpactClass, string> = {
  reuse: "Reuse",
  modify: "Modify",
  rewrite: "Rewrite",
  new: "New",
};

export const CLASS_HELP: Record<ImpactClass, string> = {
  reuse: "Existing implementation can remain substantially unchanged.",
  modify: "Existing implementation is usable but requires changes.",
  rewrite: "Existing implementation is unsuitable and needs substantial redevelopment.",
  new: "This capability does not currently exist and must be newly developed.",
};

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
