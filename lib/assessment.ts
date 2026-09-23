import { AssessmentState, Classification, Question, QuestionResponse, Workstream } from "./types";
import { questions, planTemplate } from "./questions";
import { CONFIRMATIONS, ImpactClass } from "./sections";

export const emptyResponse = (): QuestionResponse => ({
  answer: "",
  classification: "",
  explanation: "",
  effortDays: 0,
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
  plan: planTemplate.map((item) => ({ ...item })),
  status: "draft",
  checks: CONFIRMATIONS.map(() => false),
});

/** Fill in anything missing from a draft saved by an older version of the portal. */
export function hydrateAssessment(saved: Partial<AssessmentState>): AssessmentState {
  const base = initialAssessment();
  const responses = { ...base.responses };
  Object.entries(saved.responses ?? {}).forEach(([id, r]) => {
    responses[id] = { ...emptyResponse(), ...r };
  });
  const checks = base.checks.map((_, i) => Boolean(saved.checks?.[i]));
  return {
    ...base,
    ...saved,
    gameInfo: { ...base.gameInfo, ...saved.gameInfo },
    responses,
    plan: saved.plan?.length ? saved.plan : base.plan,
    checks,
  };
}

const complexityValue: Record<ImpactClass, number> = {
  reuse: 0,
  modify: 1,
  rewrite: 4,
  new: 4,
};

const complexityLevels = [
  { max: 0.16, label: "Minor Conversion", level: "minor" },
  { max: 0.34, label: "Moderate Conversion", level: "moderate" },
  { max: 0.58, label: "Major Conversion / Refactor", level: "major" },
  { max: Infinity, label: "Near-Complete Rebuild", level: "rebuild" },
];

export function calculateComplexity(state: AssessmentState) {
  let weighted = 0;
  let possible = 0;

  for (const question of questions) {
    const response = state.responses[question.id];
    possible += question.weight * 4;
    if (response?.classification) {
      weighted += question.weight * complexityValue[response.classification];
    } else if (response?.answer === "unsure") {
      weighted += question.weight * 2;
    }
  }

  const ratio = possible ? weighted / possible : 0;
  const index = complexityLevels.findIndex((band) => ratio < band.max);
  const { label, level } = complexityLevels[index];
  return { label, level, ratio, index };
}

export function totalAssessmentDays(state: AssessmentState) {
  return Object.values(state.responses).reduce((sum, r) => sum + (Number(r.effortDays) || 0), 0);
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
  const counts = { reuse: 0, modify: 0, rewrite: 0, new: 0, none: 0 };
  questions.forEach((q) => {
    const c = state.responses[q.id]?.classification;
    counts[c || "none"] += 1;
  });
  return counts;
}

export function deriveFindings(state: AssessmentState) {
  const buckets: Record<ImpactClass, string[]> = {
    reuse: [],
    modify: [],
    rewrite: [],
    new: [],
  };
  state.plan.forEach((w) => {
    if (w.classification) buckets[w.classification].push(w.title);
  });
  return buckets;
}

export function syncPlanFromAssessment(state: AssessmentState): Workstream[] {
  return state.plan.map((workstream) => {
    const related = questions.filter((q) => q.workstream === workstream.id);
    const classes = related
      .map((q) => state.responses[q.id]?.classification)
      .filter(Boolean) as ImpactClass[];

    if (!classes.length) return workstream;

    const strongest = [...classes].sort(
      (a, b) => complexityValue[b] - complexityValue[a]
    )[0];

    const explanations = related
      .map((q) => state.responses[q.id]?.explanation?.trim())
      .filter(Boolean);

    const effort = related.reduce(
      (sum, q) => sum + (Number(state.responses[q.id]?.effortDays) || 0),
      0
    );

    return {
      ...workstream,
      classification: strongest,
      whyChange: workstream.whyChange || explanations.join("\n"),
      personDays: workstream.personDays || effort,
    };
  });
}
