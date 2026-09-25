import { describe, expect, it } from "vitest";
import { initialAssessment } from "./assessment";
import { ENGINE_WORKSTREAM_ID } from "./engine";
import { allowedTransitions, assessmentChangeError, canEditPrimeTargets, editableAreas, SUBMIT_PLAN_NEEDS_CHECKS } from "./permissions";
import { STATUSES } from "./stages";
import { AssessmentState, AssessmentStatus } from "./types";
import { CONFLICT_MESSAGE, isVersionConflict } from "./versioning";

const at = (status: AssessmentStatus): AssessmentState => ({ ...initialAssessment(), status });
const withTargets = (s: AssessmentState): AssessmentState => ({ ...s, primeTargets: { ...s.primeTargets, fpsTarget: { state: "set", value: "60" } } });
const withAnswer = (s: AssessmentState): AssessmentState => ({ ...s, answers: { ...s.answers, A1: { ...initialAnswer(), text: "2021.3" } } });
const withPlanEdit = (s: AssessmentState): AssessmentState => ({ ...s, plan: s.plan.map((w, i) => (i === 0 ? { ...w, whyChange: "Old Unity" } : w)) });
const withEngineDays = (s: AssessmentState): AssessmentState => {
  const engineAssessment = { ...s.engineAssessment, recommendedPath: "shared" as const, sharedCore: { ...s.engineAssessment.sharedCore, coreOrBuildDays: 12 } };
  return { ...s, engineAssessment, plan: s.plan.map((w) => (w.id === ENGINE_WORKSTREAM_ID ? { ...w, personDays: 12 } : w)) };
};
const allChecked = (s: AssessmentState): AssessmentState => ({ ...s, checks: s.checks.map(() => true) });

function initialAnswer() {
  return { choice: { selected: [], other: "" }, rows: {}, text: "", notSureYet: false, needsChecking: "", followUps: {}, evidence: "", basis: "" as const, confirmBy: "", files: {} };
}

describe("allowedTransitions", () => {
  const expected: Record<AssessmentStatus, { developer: AssessmentStatus[]; product: AssessmentStatus[] }> = {
    discovery: { developer: ["discovery-submitted"], product: [] },
    "discovery-submitted": { developer: [], product: ["findings", "discovery"] },
    findings: { developer: [], product: ["plan"] },
    plan: { developer: ["plan-submitted"], product: [] },
    "plan-submitted": { developer: [], product: ["agreed", "plan"] },
    agreed: { developer: [], product: ["plan"] },
  };

  it.each(STATUSES.map((s) => s.value))("from %s", (status) => {
    expect(allowedTransitions("developer", status)).toEqual(expected[status].developer);
    expect(allowedTransitions("product", status)).toEqual(expected[status].product);
  });
});

describe("editableAreas", () => {
  const developer: Record<AssessmentStatus, string[]> = {
    discovery: ["answers", "developerTeam"],
    "discovery-submitted": [],
    findings: ["engine"],
    plan: ["engine", "plan", "checks"],
    "plan-submitted": [],
    agreed: [],
  };

  it.each(STATUSES.map((s) => s.value))("in %s", (status) => {
    expect([...editableAreas("developer", status)].sort()).toEqual([...developer[status]].sort());
    expect([...editableAreas("product", status)].sort()).toEqual(["answers", "checks", "developerTeam", "engine", "plan", "primeTargets"]);
  });

  it("never lets developers change the Prime targets", () => {
    expect(canEditPrimeTargets("developer")).toBe(false);
    STATUSES.forEach(({ value }) => expect(editableAreas("developer", value)).not.toContain("primeTargets"));
  });
});

describe("assessmentChangeError", () => {
  it("rejects a developer editing discovery answers after submission", () => {
    const previous = at("discovery-submitted");

    expect(assessmentChangeError("developer", previous, withAnswer(previous))).toBe("Discovery answers can only be changed while discovery is in progress.");
  });

  it("rejects a developer editing the plan before it is open", () => {
    const previous = at("findings");

    expect(assessmentChangeError("developer", previous, withPlanEdit(previous))).toBe("The conversion plan can only be changed while the plan is in progress.");
    expect(assessmentChangeError("developer", at("plan"), withPlanEdit(at("plan")))).toBeNull();
  });

  it("lets a developer edit the engine comparison in findings; the derived Engine 2.0 days are not a plan edit", () => {
    const previous = at("findings");

    expect(assessmentChangeError("developer", previous, withEngineDays(previous))).toBeNull();
    expect(assessmentChangeError("developer", at("discovery"), withEngineDays(at("discovery")))).toMatch(/engine comparison/);
  });

  it("lets a developer make a last edit and submit discovery in the same save", () => {
    const previous = at("discovery");

    expect(assessmentChangeError("developer", previous, { ...withAnswer(previous), status: "discovery-submitted" })).toBeNull();
  });

  it("rejects status changes that are not allowed", () => {
    expect(assessmentChangeError("developer", at("discovery-submitted"), at("findings"))).toMatch(/can't move this assessment/);
    expect(assessmentChangeError("developer", at("discovery"), at("plan"))).toMatch(/can't move this assessment/);
    expect(assessmentChangeError("product", at("discovery"), at("discovery-submitted"))).toMatch(/can't move this assessment/);
    expect(assessmentChangeError("product", at("plan-submitted"), at("agreed"))).toBeNull();
  });

  it("needs every confirmation to submit the plan", () => {
    const previous = at("plan");

    expect(assessmentChangeError("developer", previous, { ...previous, status: "plan-submitted" })).toBe(SUBMIT_PLAN_NEEDS_CHECKS);
    expect(assessmentChangeError("developer", previous, { ...allChecked(previous), status: "plan-submitted" })).toBeNull();
  });

  it("blocks developers from changing the Prime targets", () => {
    expect(assessmentChangeError("developer", at("discovery"), withTargets(at("discovery")))).toBe("Only the product team can change the Prime targets.");
  });

  it("allows product to change everything", () => {
    const previous = at("agreed");

    expect(assessmentChangeError("product", previous, withPlanEdit(withAnswer(withTargets(previous))))).toBeNull();
  });

  it("treats reordered but equal targets as unchanged", () => {
    const previous = at("discovery");
    const reordered = { ...previous, primeTargets: Object.fromEntries(Object.entries(previous.primeTargets).reverse()) as AssessmentState["primeTargets"] };

    expect(assessmentChangeError("developer", previous, reordered)).toBeNull();
  });
});

describe("version conflict", () => {
  it("reports a conflict only when the versions differ", () => {
    expect(isVersionConflict(3, 3)).toBe(false);
    expect(isVersionConflict(4, 3)).toBe(true);
    expect(CONFLICT_MESSAGE).toBe("This assessment was updated by someone else.");
  });
});
