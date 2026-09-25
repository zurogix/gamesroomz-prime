import { describe, expect, it } from "vitest";
import { initialAssessment } from "./assessment";
import { ENGINE_WORKSTREAM_ID } from "./engine";
import { allowedTransitions, assessmentChangeError, editableAreas, SUBMIT_PLAN_NEEDS_CHECKS } from "./permissions";
import { STATUSES } from "./stages";
import { AssessmentState, AssessmentStatus } from "./types";
import { CONFLICT_MESSAGE, isVersionConflict } from "./versioning";

const at = (status: AssessmentStatus): AssessmentState => ({ ...initialAssessment(), status });
const withTeam = (s: AssessmentState): AssessmentState => ({ ...s, gameInfo: { ...s.gameInfo, developer: "Porting team" } });
const withPlanEdit = (s: AssessmentState): AssessmentState => ({ ...s, plan: s.plan.map((w, i) => (i === 0 ? { ...w, whyChange: "Old Unity" } : w)) });
const withEngineDays = (s: AssessmentState): AssessmentState => {
  const engineAssessment = { ...s.engineAssessment, recommendedPath: "shared" as const, sharedCore: { ...s.engineAssessment.sharedCore, coreOrBuildDays: 12 } };
  return { ...s, engineAssessment, plan: s.plan.map((w) => (w.id === ENGINE_WORKSTREAM_ID ? { ...w, personDays: 12 } : w)) };
};
const allChecked = (s: AssessmentState): AssessmentState => ({ ...s, checks: s.checks.map(() => true) });


describe("allowedTransitions", () => {
  const expected: Record<AssessmentStatus, { developer: AssessmentStatus[]; product: AssessmentStatus[] }> = {
    discovery: { developer: [], product: ["findings"] },
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
    discovery: ["developerTeam"],
    findings: ["engine"],
    plan: ["engine", "plan", "checks"],
    "plan-submitted": [],
    agreed: [],
  };

  it.each(STATUSES.map((s) => s.value))("in %s", (status) => {
    expect([...editableAreas("developer", status)].sort()).toEqual([...developer[status]].sort());
    expect([...editableAreas("product", status)].sort()).toEqual(["checks", "developerTeam", "engine", "plan"]);
  });
});

describe("assessmentChangeError", () => {
  it("lets a developer change the developer / team only during discovery", () => {
    expect(assessmentChangeError("developer", at("discovery"), withTeam(at("discovery")))).toBeNull();
    expect(assessmentChangeError("developer", at("findings"), withTeam(at("findings")))).toMatch(/developer \/ team/);
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

  it("leaves discovery submission to each developer's response: no game transition for developers", () => {
    expect(assessmentChangeError("developer", at("discovery"), at("findings"))).toMatch(/can't move this assessment/);
    expect(assessmentChangeError("product", at("discovery"), at("findings"))).toBeNull();
  });

  it("rejects status changes that are not allowed", () => {
    expect(assessmentChangeError("developer", at("discovery"), at("plan"))).toMatch(/can't move this assessment/);
    expect(assessmentChangeError("product", at("findings"), at("discovery"))).toMatch(/can't move this assessment/);
    expect(assessmentChangeError("product", at("plan-submitted"), at("agreed"))).toBeNull();
  });

  it("needs every confirmation to submit the plan", () => {
    const previous = at("plan");

    expect(assessmentChangeError("developer", previous, { ...previous, status: "plan-submitted" })).toBe(SUBMIT_PLAN_NEEDS_CHECKS);
    expect(assessmentChangeError("developer", previous, { ...allChecked(previous), status: "plan-submitted" })).toBeNull();
  });

  it("allows product to change everything", () => {
    const previous = at("agreed");

    expect(assessmentChangeError("product", previous, withPlanEdit(withTeam(previous)))).toBeNull();
  });

  it("treats a reordered but equal engine comparison as unchanged", () => {
    const previous = at("discovery");
    const engineAssessment = Object.fromEntries(Object.entries(previous.engineAssessment).reverse()) as AssessmentState["engineAssessment"];

    expect(assessmentChangeError("developer", previous, { ...previous, engineAssessment })).toBeNull();
  });
});

describe("version conflict", () => {
  it("reports a conflict only when the versions differ", () => {
    expect(isVersionConflict(3, 3)).toBe(false);
    expect(isVersionConflict(4, 3)).toBe(true);
    expect(CONFLICT_MESSAGE).toBe("This assessment was updated by someone else.");
  });
});
