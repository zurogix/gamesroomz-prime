import { DISCOVERY_SECTIONS } from "./discovery";
import { OVERVIEW, PLAN } from "./sections";

export type RailKind = "discovery" | "overview" | "plan" | "none";

/** Which right-hand rail a view shows. The Management Summary has none. */
export function railKindFor(view: string): RailKind {
  if (view === OVERVIEW) return "overview";
  if (view === PLAN) return "plan";
  if (DISCOVERY_SECTIONS.some((s) => s.title === view)) return "discovery";
  return "none";
}

export const questionElementId = (id: string) => `question-${id}`;

/** Scrolls a rendered discovery question into view and moves keyboard focus to it. */
export function focusQuestion(id: string) {
  const el = document.getElementById(questionElementId(id));
  if (!el) return;
  el.scrollIntoView({ block: "start", behavior: "smooth" });
  el.focus({ preventScroll: true });
}
