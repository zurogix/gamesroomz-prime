import { AssessmentState, Classification, QuestionResponse, Workstream } from "./types";
import { questions, planTemplate } from "./questions";

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
});

const complexityValue: Record<Exclude<Classification, "">, number> = {
  reuse: 0,
  modify: 1,
  rewrite: 4,
  new: 4,
};

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
  if (ratio < 0.16) return { label: "Minor Conversion", level: "minor", ratio };
  if (ratio < 0.34) return { label: "Moderate Conversion", level: "moderate", ratio };
  if (ratio < 0.58) return { label: "Major Conversion / Refactor", level: "major", ratio };
  return { label: "Near-Complete Rebuild", level: "rebuild", ratio };
}

export function totalAssessmentDays(state: AssessmentState) {
  return Object.values(state.responses).reduce((sum, r) => sum + (Number(r.effortDays) || 0), 0);
}

export function totalPlanDays(state: AssessmentState) {
  return state.plan.reduce((sum, w) => sum + (Number(w.personDays) || 0), 0);
}

export function planCoverage(state: AssessmentState) {
  const complete = state.plan.filter(
    (w) =>
      w.classification &&
      w.proposedImplementation.trim() &&
      w.deliverable.trim() &&
      Number(w.personDays) >= 0
  ).length;
  return Math.round((complete / state.plan.length) * 100);
}

export function assessmentCoverage(state: AssessmentState) {
  const complete = questions.filter((q) => {
    const r = state.responses[q.id];
    return r && r.answer && r.classification;
  }).length;
  return Math.round((complete / questions.length) * 100);
}

export function deriveFindings(state: AssessmentState) {
  const buckets: Record<string, string[]> = {
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
      .filter(Boolean) as Exclude<Classification, "">[];

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
