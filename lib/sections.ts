import { DISCOVERY_SECTIONS } from "./discovery";
import { Classification } from "./types";

export type ImpactClass = Exclude<Classification, "">;

export const OVERVIEW = "Overview";
export const FINDINGS = "Findings & Options";
export const PLAN = "Conversion Plan";
export const SUMMARY = "Management Summary";

/** Each discovery section is its own view, named by its title. */
export const ASSESSMENT_SECTIONS = DISCOVERY_SECTIONS.map((s) => s.title);

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

export const CONFIRMATIONS = [
  "The discovery answers describe the current game as it is built today, with open items noted.",
  "Workstreams marked Rewrite or New explain what in the current code leads to that choice.",
  "Optional enhancements are listed separately from the work the first Prime release requires.",
  "Person-day estimates include implementation and developer testing.",
  "The Multiplayer Engine 2.0 comparison covers both paths and records the reasons for the recommended one.",
];

export function riskColor(risk: string) {
  if (risk === "high") return "var(--risk-high)";
  if (risk === "medium") return "var(--risk-med)";
  return "var(--risk-low)";
}

export function formatDays(n: number) {
  return (Math.round((Number(n) || 0) * 10) / 10).toString();
}
