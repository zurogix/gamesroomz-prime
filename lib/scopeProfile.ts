import { CLASSES, ImpactClass } from "./sections";
import { Category, Workstream } from "./types";

export type ScopeRow = { classification: ImpactClass; count: number; days: number };
export type ScopeGroup = { category: Category; rows: ScopeRow[]; count: number; days: number };
export type ScopeProfile = {
  game: ScopeGroup;
  platform: ScopeGroup;
  unclassified: number;
  incomplete: string | null;
};

const daysOf = (items: Workstream[]) => items.reduce((sum, w) => sum + (Number(w.personDays) || 0), 0);

function group(plan: Workstream[], category: Category): ScopeGroup {
  const items = plan.filter((w) => w.category === category);
  const rows = CLASSES.map((classification) => {
    const matching = items.filter((w) => w.classification === classification);
    return { classification, count: matching.length, days: daysOf(matching) };
  });
  return { category, rows, count: items.length, days: daysOf(items) };
}

export function incompleteLabel(unclassified: number) {
  if (unclassified === 0) return null;
  const noun = unclassified === 1 ? "workstream" : "workstreams";
  return `Incomplete — ${unclassified} ${noun} not classified`;
}

/** Count and person-days per label, kept separate for game and platform workstreams. */
export function scopeProfile(plan: Workstream[]): ScopeProfile {
  const unclassified = plan.filter((w) => !w.classification).length;
  return {
    game: group(plan, "game"),
    platform: group(plan, "platform"),
    unclassified,
    incomplete: incompleteLabel(unclassified),
  };
}
