import { AssessmentState, AssessmentStatus, SavedDraft, Workstream } from "./types";
import { planTemplate } from "./planTemplate";
import { CLASSES, CONFIRMATIONS, ImpactClass, STATUS_STEPS } from "./sections";
import { applyEngineEstimate, emptyEngineAssessment } from "./engine";
import { DISCOVERY_QUESTIONS } from "./discovery";
import { hydrateAnswer } from "./discoveryAnswers";
import { replaceLegacyDefaults } from "./legacyTemplateDefaults";
import { migrateClassification } from "./migrate";
import { emptyPrimeTargets } from "./primeTargets";

export { applyEngineEstimate, engineAssessmentIssues, engineOptionTotal, rewriteNeedsEvidence, selectedEngineEstimate } from "./engine";

export const initialAssessment = (): AssessmentState => ({
  gameInfo: {
    gameName: "Bubble Shooter PvP",
    developer: "",
    currentUnity: "",
    currentAndroidApi: "",
    currentPlatforms: "Android / iOS",
    currentMultiplayer: "Online PvP — one player per mobile device",
    targetPlayers: "2 players on one Prime device",
    assessmentDate: new Date().toISOString().slice(0, 10),
  },
  primeTargets: emptyPrimeTargets(),
  answers: {},
  engineAssessment: emptyEngineAssessment(),
  plan: planTemplate.map((item) => ({ ...item })),
  status: "draft",
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

function hydrateStatus(status: string | undefined): AssessmentStatus {
  if (status === "approved") return "agreed";
  return STATUS_STEPS.find((s) => s.value === status)?.value ?? "draft";
}

function hydrateAnswers(saved: SavedDraft["answers"]): AssessmentState["answers"] {
  if (!saved) return {};
  const known = DISCOVERY_QUESTIONS.filter((q) => saved[q.id]);
  return Object.fromEntries(known.map((q) => [q.id, hydrateAnswer(saved[q.id])]));
}

/** Fill in anything missing from a saved v2 draft and drop fields that no longer exist. */
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
  const primeTargets = { ...base.primeTargets, ...saved.primeTargets };
  return {
    ...base,
    gameInfo: { ...base.gameInfo, ...saved.gameInfo },
    primeTargets: { ...primeTargets, modes: Array.isArray(primeTargets.modes) ? primeTargets.modes : [] },
    answers: hydrateAnswers(saved.answers),
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
