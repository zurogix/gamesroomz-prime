import {
  AssessmentState,
  Classification,
  Question,
  QuestionResponse,
  Workstream,
} from "./types";
import { questions, planTemplate } from "./questions";
import { CLASSES, CONFIRMATIONS, ImpactClass } from "./sections";

export const emptyResponse = (): QuestionResponse => ({
  answer: "",
  classification: "",
  explanation: "",
});
export const initialAssessment = (): AssessmentState => ({
  schemaVersion: 2,
  gameInfo: {
    gameName: "Bubble Shooter PvP",
    developer: "",
    currentUnity: "",
    currentAndroidApi: "",
    currentPlatforms: "Android / iOS",
    currentMultiplayer: "Online PvP — one player per mobile device",
    targetPlayers: "2 players on one Prime device",
    assessmentDate: new Date().toISOString().slice(0, 10),
    targetHardware: "",
    targetUnity: "",
    targetLayout: "",
    platformContract: "",
    performanceTarget: "",
  },
  responses: Object.fromEntries(questions.map((q) => [q.id, emptyResponse()])),
  plan: planTemplate.map((w) => ({ ...w })),
  status: "draft",
  checks: CONFIRMATIONS.map(() => false),
});

const isObject = (v: unknown): v is Record<string, unknown> =>
  Boolean(v && typeof v === "object" && !Array.isArray(v));
const classification = (v: unknown): Classification =>
  CLASSES.includes(v as ImpactClass) ? (v as ImpactClass) : "";
export const validDays = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;

/** Old answers are retained for reference, never silently applied to changed questions. */
export function hydrateAssessment(saved: unknown): AssessmentState {
  const base = initialAssessment();
  if (!isObject(saved)) return base;
  const current = saved.schemaVersion === 2;
  if (isObject(saved.gameInfo)) {
    for (const key of Object.keys(
      base.gameInfo,
    ) as (keyof typeof base.gameInfo)[]) {
      if (typeof saved.gameInfo[key] === "string")
        base.gameInfo[key] = saved.gameInfo[key] as string;
    }
  }
  if (current && isObject(saved.responses)) {
    for (const q of questions) {
      const r = saved.responses[q.id];
      if (!isObject(r)) continue;
      const c = classification(r.classification);
      const pending = r.answer === "unsure" || r.answer === "awaiting";
      base.responses[q.id] = {
        answer: pending ? (r.answer as "unsure" | "awaiting") : c ? "yes" : "",
        classification: pending ? "" : c,
        explanation: typeof r.explanation === "string" ? r.explanation : "",
      };
    }
  }
  if (Array.isArray(saved.plan)) {
    base.plan = base.plan.map((w) => {
      const prior =
        saved.plan instanceof Array
          ? saved.plan.find((x) => isObject(x) && x.id === w.id)
          : null;
      if (!isObject(prior)) return w;
      const next = { ...w };
      for (const key of [
        "currentImplementation",
        "whyChange",
        "proposedImplementation",
        "reusedComponents",
        "changedComponents",
        "deliverable",
        "dependencies",
      ] as const) {
        if (typeof prior[key] === "string") next[key] = prior[key];
      }
      next.classification = current ? classification(prior.classification) : "";
      next.personDays =
        validDays(prior.personDays) && (current || prior.personDays > 0)
          ? prior.personDays
          : null;
      next.risk =
        current && ["low", "medium", "high"].includes(String(prior.risk))
          ? (prior.risk as Workstream["risk"])
          : "";
      next.scopeType =
        prior.scopeType === "enhancement" ? "enhancement" : "mandatory";
      next.reviewed = current && prior.reviewed === true;
      return next;
    });
  }
  if (!current) base.legacyDraft = saved;
  else if (saved.legacyDraft) base.legacyDraft = saved.legacyDraft;
  if (current) {
    base.checks = base.checks.map(
      (_, i) => Array.isArray(saved.checks) && saved.checks[i] === true,
    );
    const status = saved.status as AssessmentState["status"];
    if (
      [
        "draft",
        "planning",
        "assessment-complete",
        "submitted",
        "changes-requested",
        "approved",
      ].includes(status) &&
      canSetStatus(base, status)
    )
      base.status = status;
  }
  return base;
}

export function isQuestionDone(state: AssessmentState, q: Question) {
  const r = state.responses[q.id];
  return Boolean(
    r?.answer === "yes" && r.classification && r.explanation.trim(),
  );
}
export function assessmentCoverage(state: AssessmentState) {
  return Math.round(
    (questions.filter((q) => isQuestionDone(state, q)).length /
      questions.length) *
      100,
  );
}
export function needsReason(state: AssessmentState, q: Question) {
  const r = state.responses[q.id];
  return Boolean(r?.classification && !r.explanation.trim());
}
export type AttentionItem = {
  question: Question;
  kind: "reason" | "unsure" | "awaiting" | "unanswered";
  classification: Classification;
};
export function attentionItems(state: AssessmentState): AttentionItem[] {
  return questions
    .filter((q) => !isQuestionDone(state, q))
    .map((question) => {
      const r = state.responses[question.id];
      return {
        question,
        classification: r?.classification || "",
        kind: needsReason(state, question)
          ? "reason"
          : r?.answer === "awaiting"
            ? "awaiting"
            : r?.answer === "unsure"
              ? "unsure"
              : "unanswered",
      };
    });
}
export function classificationCounts(state: AssessmentState) {
  const counts = { reuse: 0, modify: 0, rewrite: 0, new: 0, na: 0, none: 0 };
  questions.forEach((q) => {
    counts[state.responses[q.id]?.classification || "none"] += 1;
  });
  return counts;
}

export const PLAN_FIELD_COUNT = 8;
export function hasEstimate(w: Workstream) {
  if (!validDays(w.personDays)) return false;
  if (w.classification === "na") return w.personDays === 0;
  if (w.classification === "reuse") return true;
  return Boolean(w.classification && w.personDays > 0);
}
export function planFieldsDone(w: Workstream) {
  if (w.classification === "na")
    return w.whyChange.trim() && hasEstimate(w) && w.reviewed
      ? PLAN_FIELD_COUNT
      : 0;
  return [
    w.classification,
    w.whyChange.trim(),
    w.proposedImplementation.trim(),
    w.deliverable.trim(),
    w.dependencies.trim(),
    hasEstimate(w),
    w.risk,
    w.reviewed,
  ].filter(Boolean).length;
}
export function workstreamIssues(
  state: AssessmentState,
  w: Workstream,
): string[] {
  const related = questions.filter((q) => q.workstream === w.id);
  const issues: string[] = [];
  if (related.some((q) => !isQuestionDone(state, q)))
    issues.push("Resolve linked assessment findings");
  const classes = related.map((q) => state.responses[q.id]?.classification);
  if (w.classification === "na" && classes.some((c) => c !== "na"))
    issues.push("Not applicable conflicts with linked findings");
  if (
    w.classification === "reuse" &&
    classes.some((c) => c && c !== "reuse" && c !== "na")
  )
    issues.push("Reuse conflicts with linked changes");
  if (planFieldsDone(w) < PLAN_FIELD_COUNT)
    issues.push("Complete the plan, estimate, risk and review");
  return issues;
}
export function planCoverage(state: AssessmentState) {
  return state.plan.length
    ? Math.round(
        (state.plan.filter((w) => !workstreamIssues(state, w).length).length /
          state.plan.length) *
          100,
      )
    : 0;
}
export const effortDays = (w: Workstream) =>
  w.classification !== "na" && validDays(w.personDays) ? w.personDays : 0;
export function totalPlanDays(state: AssessmentState) {
  return state.plan.reduce((sum, w) => sum + effortDays(w), 0);
}
export function deriveFindings(state: AssessmentState) {
  const buckets: Record<ImpactClass, string[]> = {
    reuse: [],
    modify: [],
    rewrite: [],
    new: [],
    na: [],
  };
  state.plan.forEach((w) => {
    if (w.classification) buckets[w.classification].push(w.title);
  });
  return buckets;
}
export function targetGaps(state: AssessmentState) {
  const fields = {
    targetHardware: "Prime device / OS / resolution",
    targetUnity: "Unity / SDK baseline",
    targetLayout: "Seating and playfield layout",
    platformContract: "Gamesroomz / launcher contract",
    performanceTarget: "Performance acceptance targets",
  } as const;
  return Object.entries(fields)
    .filter(([key]) => !state.gameInfo[key as keyof typeof fields].trim())
    .map(([, label]) => label);
}
export function reviewBlockers(state: AssessmentState) {
  const blockers = targetGaps(state).map((label) => `Confirm ${label}`);
  const questionsLeft = attentionItems(state).length;
  if (questionsLeft)
    blockers.push(
      `${questionsLeft} assessment findings need resolution or evidence`,
    );
  const plansLeft = state.plan.filter(
    (w) => workstreamIssues(state, w).length,
  ).length;
  if (plansLeft)
    blockers.push(
      `${plansLeft} workstreams need a complete, consistent plan and review`,
    );
  if (!state.gameInfo.gameName.trim() || !state.gameInfo.developer.trim())
    blockers.push("Enter the game name and developer / team");
  return blockers;
}
export function assessmentSummary(state: AssessmentState) {
  const started = questions.some((q) => {
    const r = state.responses[q.id];
    return r?.classification || r?.answer || r?.explanation.trim();
  });
  const ready = reviewBlockers(state).length === 0;
  return {
    label: !started
      ? "Not assessed"
      : ready
        ? "Ready for review"
        : "Preliminary — incomplete",
    ready,
  };
}
export function canSetStatus(
  state: AssessmentState,
  status: AssessmentState["status"],
) {
  if (status === "assessment-complete")
    return assessmentCoverage(state) === 100 && targetGaps(state).length === 0;
  if (status === "submitted" || status === "approved")
    return reviewBlockers(state).length === 0 && state.checks.every(Boolean);
  return true;
}

/** Copy evidence only into an empty plan field. Never infer a blanket rewrite or add overlapping estimates. */
export function syncPlanFromAssessment(state: AssessmentState): Workstream[] {
  return state.plan.map((w) => {
    const notes = questions
      .filter((q) => q.workstream === w.id)
      .flatMap((q) => {
        const r = state.responses[q.id];
        return r?.explanation.trim()
          ? [`${q.prompt}\n${r.explanation.trim()}`]
          : [];
      })
      .join("\n\n");
    return !w.whyChange && notes
      ? { ...w, whyChange: notes, reviewed: false }
      : w;
  });
}
