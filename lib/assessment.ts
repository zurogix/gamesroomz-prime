import { AssessmentState, Classification, Question, QuestionResponse, SavedDraft, Workstream } from "./types";
import { questions, planTemplate } from "./questions";
import { CLASSES, CONFIRMATIONS, ImpactClass } from "./sections";
import { emptyEngineAssessment } from "./engine";
import { applyEngineEstimate } from "./sync";
import { migrateClassification } from "./migrate";

export { engineAssessmentIssues, engineOptionTotal, selectedEngineEstimate, rewriteNeedsEvidence } from "./engine";
export { applyEngineEstimate, strongestClassification, syncPlanFromAssessment } from "./sync";

export const emptyResponse = (): QuestionResponse => ({
  answer: "",
  classification: "",
  explanation: "",
});

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
  responses: Object.fromEntries(questions.map((q) => [q.id, emptyResponse()])),
  engineAssessment: emptyEngineAssessment(),
  plan: planTemplate.map((item) => ({ ...item })),
  status: "draft",
  checks: CONFIRMATIONS.map(() => false),
});

function hydrateResponse(saved: Partial<QuestionResponse> | undefined): QuestionResponse {
  return {
    answer: saved?.answer ?? "",
    classification: migrateClassification(saved?.classification),
    explanation: saved?.explanation ?? "",
  };
}

/** Saved text wins; static data (title, category) always comes from the template. */
function hydrateWorkstream(template: Workstream, saved: Partial<Workstream> | undefined): Workstream {
  return {
    ...template,
    ...saved,
    id: template.id,
    title: template.title,
    category: template.category,
    classification: migrateClassification(saved?.classification ?? template.classification),
  };
}

/** Fill in anything missing from a saved v2 draft and drop fields that no longer exist. */
export function hydrateAssessment(saved: SavedDraft): AssessmentState {
  const base = initialAssessment();
  const responses = Object.fromEntries(questions.map((q) => [q.id, hydrateResponse(saved.responses?.[q.id])]));
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
    gameInfo: { ...base.gameInfo, ...saved.gameInfo },
    status: saved.status ?? base.status,
    lastSavedAt: saved.lastSavedAt,
    responses,
    engineAssessment,
    plan: applyEngineEstimate(plan, engineAssessment),
    checks: base.checks.map((_, i) => Boolean(saved.checks?.[i])),
  };
}

const complexityValue: Record<ImpactClass, number> = {
  reuse: 0,
  remove: 1,
  extend: 1,
  refactor: 2,
  rewrite: 4,
  new: 4,
};
const MAX_COMPLEXITY = 4;

const complexityLevels = [
  { max: 0.16, label: "Minor Conversion", level: "minor" },
  { max: 0.34, label: "Moderate Conversion", level: "moderate" },
  { max: 0.58, label: "Major Conversion / Refactor", level: "major" },
  { max: Infinity, label: "Near-Complete Rebuild", level: "rebuild" },
];

export const gameQuestions = questions.filter((q) => q.category === "game");

/** Scores game-side work only; platform work is the same for every game. */
export function calculateComplexity(state: AssessmentState) {
  const unclassified = gameQuestions.filter((q) => !state.responses[q.id]?.classification).length;
  if (unclassified > 0) {
    const noun = unclassified === 1 ? "question" : "questions";
    return { label: `Incomplete — ${unclassified} ${noun} not classified`, level: "incomplete", ratio: 0, index: -1 };
  }

  const possible = gameQuestions.reduce((sum, q) => sum + q.weight * MAX_COMPLEXITY, 0);
  const weighted = gameQuestions.reduce((sum, q) => {
    const c = state.responses[q.id].classification as ImpactClass;
    return sum + q.weight * complexityValue[c];
  }, 0);
  const ratio = possible ? weighted / possible : 0;
  const index = complexityLevels.findIndex((band) => ratio < band.max);
  const { label, level } = complexityLevels[index];
  return { label, level, ratio, index };
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

export function isQuestionDone(state: AssessmentState, q: Question) {
  const r = state.responses[q.id];
  return Boolean(r?.answer && r.classification);
}

export function assessmentCoverage(state: AssessmentState) {
  const complete = questions.filter((q) => isQuestionDone(state, q)).length;
  return Math.round((complete / questions.length) * 100);
}

export function needsReason(state: AssessmentState, q: Question) {
  const r = state.responses[q.id];
  const heavy = r?.classification === "rewrite" || r?.classification === "new";
  return heavy && !r.explanation.trim();
}

export type AttentionItem = { question: Question; kind: "reason" | "unsure"; classification: Classification };

export function attentionItems(state: AssessmentState): AttentionItem[] {
  return questions.flatMap((question): AttentionItem[] => {
    const r = state.responses[question.id];
    if (needsReason(state, question)) return [{ question, kind: "reason", classification: r.classification }];
    if (r?.answer === "unsure") return [{ question, kind: "unsure", classification: r.classification }];
    return [];
  });
}

export function classificationCounts(state: AssessmentState) {
  const counts: Record<ImpactClass | "none", number> = { reuse: 0, extend: 0, refactor: 0, rewrite: 0, new: 0, remove: 0, none: 0 };
  questions.forEach((q) => {
    const c = state.responses[q.id]?.classification;
    counts[c || "none"] += 1;
  });
  return counts;
}

export function deriveFindings(state: AssessmentState) {
  const buckets = Object.fromEntries(CLASSES.map((c) => [c, [] as string[]])) as Record<ImpactClass, string[]>;
  state.plan.forEach((w) => {
    if (w.classification) buckets[w.classification].push(w.title);
  });
  return buckets;
}
