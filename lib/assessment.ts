import { AssessmentState, Classification, SavedDraft, Workstream } from "./types";
import { planTemplate } from "./planTemplate";
import { CLASSES, CONFIRMATIONS, ImpactClass } from "./sections";
import { DEFAULT_STATUS, hydrateStatus } from "./stages";
import { applyEngineEstimate, emptyEngineAssessment } from "./engine";
import { replaceLegacyDefaults } from "./legacyTemplateDefaults";

export { applyEngineEstimate, engineAssessmentIssues, engineOptionTotal, rewriteNeedsEvidence, selectedEngineEstimate } from "./engine";

/** "modify" no longer exists, so those items must be re-classified. */
export function migrateClassification(value: string | undefined): Classification {
  return CLASSES.includes(value as ImpactClass) ? (value as Classification) : "";
}

export const initialAssessment = (): AssessmentState => ({
  gameInfo: { gameName: "Bubble Shooter PvP", developer: "" },
  engineAssessment: emptyEngineAssessment(),
  plan: planTemplate.map((item) => ({ ...item })),
  status: DEFAULT_STATUS,
  checks: CONFIRMATIONS.map(() => false),
});

/**
 * Saved text wins, except untouched old template defaults, which take the current
 * template value. Static data (title, category) always comes from the template.
 */
function hydrateWorkstream(template: Workstream, saved: Partial<Workstream> | undefined): Workstream {
  const merged = {
    ...template,
    ...saved,
    id: template.id,
    title: template.title,
    category: template.category,
    classification: migrateClassification(saved?.classification ?? template.classification),
  };
  return replaceLegacyDefaults(merged, template);
}

/**
 * Fill in anything missing from a saved state and drop fields that no longer exist (e.g. primeTargets,
 * and discovery answers, which are now kept per developer in DiscoveryResponse).
 */
export function hydrateAssessment(saved: SavedDraft): AssessmentState {
  const base = initialAssessment();
  const savedPlanById = new Map((saved.plan ?? []).map((item) => [item.id, item]));
  const engineAssessment = {
    ...base.engineAssessment,
    ...saved.engineAssessment,
    engineClassification: migrateClassification(saved.engineAssessment?.engineClassification),
    sharedCore: { ...base.engineAssessment.sharedCore, ...saved.engineAssessment?.sharedCore },
    separatePrime: { ...base.engineAssessment.separatePrime, ...saved.engineAssessment?.separatePrime },
  };
  const plan = base.plan.map((item) => hydrateWorkstream(item, savedPlanById.get(item.id)));
  return {
    ...base,
    // Only the name and developer / team are kept; older fields are dropped.
    gameInfo: {
      gameName: saved.gameInfo?.gameName ?? base.gameInfo.gameName,
      developer: saved.gameInfo?.developer ?? base.gameInfo.developer,
    },
    status: hydrateStatus(saved.status),
    lastSavedAt: saved.lastSavedAt,
    engineAssessment,
    plan: applyEngineEstimate(plan, engineAssessment),
    checks: base.checks.map((_, i) => Boolean(saved.checks?.[i])),
  };
}

export function totalPlanDays(state: AssessmentState) {
  return state.plan.reduce((sum, w) => sum + (Number(w.personDays) || 0), 0);
}

export const PLAN_FIELD_COUNT = 6;

/** How many of the six fields a reviewer needs are filled in for a workstream. */
export function planFieldsDone(w: Workstream) {
  return [
    w.classification,
    w.whyChange.trim(),
    w.proposedImplementation.trim(),
    w.deliverable.trim(),
    w.dependencies.trim(),
    Number(w.personDays) > 0,
  ].filter(Boolean).length;
}

export function planCoverage(state: AssessmentState) {
  const complete = state.plan.filter((w) => planFieldsDone(w) === PLAN_FIELD_COUNT).length;
  return Math.round((complete / state.plan.length) * 100);
}

export function deriveFindings(state: AssessmentState) {
  const buckets = Object.fromEntries(CLASSES.map((c) => [c, [] as string[]])) as Record<ImpactClass, string[]>;
  state.plan.forEach((w) => {
    if (w.classification) buckets[w.classification].push(w.title);
  });
  return buckets;
}
