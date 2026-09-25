import { describe, expect, it } from "vitest";
import { hydrateAssessment, initialAssessment } from "@/lib/assessment";
import { saveAssessmentSchema } from "./api";
import { assessmentStateSchema } from "./assessment";

describe("assessment state schema", () => {
  it("accepts a valid state", () => {
    const state = {
      ...initialAssessment(),
      answers: {
        A1: {
          choice: { selected: ["2021"], other: "" },
          rows: {},
          text: "",
          notSureYet: false,
          needsChecking: "",
          followUps: {},
          evidence: "ProjectVersion.txt",
          basis: "confirmed" as const,
          confirmBy: "",
          files: { projectVersion: "m_EditorVersion: 2021.3.16f1" },
        },
      },
    };

    expect(assessmentStateSchema.safeParse(state).success).toBe(true);
  });

  it("drops Prime targets from older saved states", () => {
    const saved = { ...initialAssessment(), primeTargets: { unityVersion: "2022.3", layoutSketch: "https://x.test" } };
    const parsed = assessmentStateSchema.safeParse(saved);

    expect(parsed.success).toBe(true);
    expect(parsed.data).not.toHaveProperty("primeTargets");
    expect(hydrateAssessment(saved)).not.toHaveProperty("primeTargets");
  });

  it("rejects bad input", () => {
    const state = initialAssessment();

    expect(assessmentStateSchema.safeParse({ ...state, status: "approved" }).success).toBe(false);
    expect(assessmentStateSchema.safeParse({ ...state, plan: [{ id: "x" }] }).success).toBe(false);
    expect(assessmentStateSchema.safeParse({ ...state, engineAssessment: { ...state.engineAssessment, recommendedPath: "both" } }).success).toBe(false);
    expect(assessmentStateSchema.safeParse({ ...state, plan: state.plan.map((w) => ({ ...w, personDays: -1 })) }).success).toBe(false);
    expect(assessmentStateSchema.safeParse(null).success).toBe(false);
  });

  it("requires a positive integer version on save", () => {
    const state = initialAssessment();

    expect(saveAssessmentSchema.safeParse({ state, version: 1 }).success).toBe(true);
    expect(saveAssessmentSchema.safeParse({ state, version: 0 }).success).toBe(false);
    expect(saveAssessmentSchema.safeParse({ state, version: 1.5 }).success).toBe(false);
  });
});
