import { describe, expect, it } from "vitest";
import { initialAssessment } from "./assessment";
import { allowedStatuses, assessmentChangeError, canEditPrimeTargets } from "./permissions";
import { AssessmentState } from "./types";
import { CONFLICT_MESSAGE, isVersionConflict } from "./versioning";

const base = (): AssessmentState => ({ ...initialAssessment(), status: "planning" });
const withTargets = (s: AssessmentState): AssessmentState => ({ ...s, primeTargets: { ...s.primeTargets, fpsTarget: { state: "set", value: "60" } } });

describe("permissions", () => {
  it("blocks developers from changing the Prime targets", () => {
    const previous = base();

    expect(canEditPrimeTargets("developer")).toBe(false);
    expect(assessmentChangeError("developer", previous, withTargets(previous))).toBe("Only the product team can change the Prime targets.");
  });

  it("blocks developers from setting product-only statuses", () => {
    const previous = base();

    expect(assessmentChangeError("developer", previous, { ...previous, status: "agreed" })).toMatch(/Only the product team/);
    expect(assessmentChangeError("developer", previous, { ...previous, status: "changes-requested" })).toMatch(/Only the product team/);
    expect(allowedStatuses("developer")).toEqual(["draft", "assessment-complete", "planning", "submitted"]);
  });

  it("lets developers make other changes, including keeping an agreed status", () => {
    const agreed = { ...base(), status: "agreed" as const };
    const edited = { ...agreed, gameInfo: { ...agreed.gameInfo, developer: "Porting team" } };

    expect(assessmentChangeError("developer", base(), { ...base(), status: "submitted" })).toBeNull();
    expect(assessmentChangeError("developer", agreed, edited)).toBeNull();
  });

  it("allows product to change everything", () => {
    const previous = base();

    expect(assessmentChangeError("product", previous, { ...withTargets(previous), status: "agreed" })).toBeNull();
    expect(allowedStatuses("product")).toContain("changes-requested");
  });

  it("treats reordered but equal targets as unchanged", () => {
    const previous = base();
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
