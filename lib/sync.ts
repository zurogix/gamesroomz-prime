import { ENGINE_WORKSTREAM_ID, engineOptionTotal, selectedEngineEstimate } from "./engine";
import { planTemplate, questions } from "./questions";
import { ImpactClass } from "./sections";
import { AssessmentState, Classification, MultiplayerEngineAssessment, Workstream } from "./types";

/** Strongest first: new = rewrite > refactor > extend > remove > reuse. */
const CLASS_STRENGTH: Record<ImpactClass, number> = {
  reuse: 0,
  remove: 1,
  extend: 2,
  refactor: 3,
  rewrite: 4,
  new: 4,
};

type FillableField = "whyChange" | "proposedImplementation" | "reusedComponents";

const templateById = new Map(planTemplate.map((w) => [w.id, w]));

export function strongestClassification(classes: Classification[]): Classification {
  return classes.reduce<Classification>((best, c) => {
    if (!c) return best;
    if (!best) return c;
    return CLASS_STRENGTH[c] > CLASS_STRENGTH[best] ? c : best;
  }, "");
}

/** A field is still empty when it is blank or holds only the template's placeholder text. */
function isUnwritten(w: Workstream, field: FillableField) {
  const value = w[field].trim();
  return !value || value === templateById.get(w.id)?.[field].trim();
}

function fillIfEmpty(w: Workstream, field: FillableField, text: string): Partial<Workstream> {
  if (!text.trim() || !isUnwritten(w, field)) return {};
  return { [field]: text.trim() };
}

/** Engine 2.0 effort and risk always come from the recommended path's estimate. */
export function applyEngineEstimate(plan: Workstream[], engine: MultiplayerEngineAssessment): Workstream[] {
  const estimate = selectedEngineEstimate(engine);
  return plan.map((w) => {
    if (w.id !== ENGINE_WORKSTREAM_ID) return w;
    if (!estimate) return { ...w, personDays: 0 };
    return { ...w, personDays: engineOptionTotal(estimate), risk: estimate.risk };
  });
}

function questionClassification(state: AssessmentState, workstreamId: string) {
  const related = questions.filter((q) => q.workstream === workstreamId);
  return strongestClassification(related.map((q) => state.responses[q.id]?.classification ?? ""));
}

function syncEngineWorkstream(state: AssessmentState, w: Workstream): Workstream {
  const engine = state.engineAssessment;
  const why = engine.engineClassification === "rewrite" && engine.rewriteReason.trim()
    ? engine.rewriteReason
    : engine.pathJustification;
  return {
    ...w,
    classification: engine.engineClassification || questionClassification(state, w.id),
    ...fillIfEmpty(w, "whyChange", why),
    ...fillIfEmpty(w, "proposedImplementation", engine.migrationPlan),
    ...fillIfEmpty(w, "reusedComponents", engine.reusableComponents),
  };
}

function syncQuestionWorkstream(state: AssessmentState, w: Workstream): Workstream {
  const explanations = questions
    .filter((q) => q.workstream === w.id)
    .map((q) => state.responses[q.id]?.explanation?.trim())
    .filter(Boolean)
    .join("\n");
  return {
    ...w,
    classification: questionClassification(state, w.id),
    ...fillIfEmpty(w, "whyChange", explanations),
  };
}

/**
 * Derives workstream classifications and Engine 2.0 effort from the assessment.
 * Idempotent: running it again on its own output returns the same plan, and it
 * only fills text fields the developer has not written.
 */
export function syncPlanFromAssessment(state: AssessmentState): Workstream[] {
  const plan = state.plan.map((w) =>
    w.id === ENGINE_WORKSTREAM_ID ? syncEngineWorkstream(state, w) : syncQuestionWorkstream(state, w)
  );
  return applyEngineEstimate(plan, state.engineAssessment);
}
