import { describe, expect, it } from "vitest";
import { applyEngineEstimate, engineAssessmentIssues, hydrateAssessment, initialAssessment, migrateClassification } from "./assessment";
import { ENGINE_WORKSTREAM_ID } from "./engine";
import { scopeProfile } from "./scopeProfile";
import { AssessmentState, EngineOptionEstimate, Workstream } from "./types";

function estimate(days: number, risk: EngineOptionEstimate["risk"]): EngineOptionEstimate {
  return {
    coreOrBuildDays: days,
    mobileRegressionDays: 0,
    primeIntegrationDays: 0,
    qaDays: 0,
    sharedCode: "high",
    risk,
    maintenanceImpact: "Documented",
    notes: "",
  };
}

const engineOf = (plan: Workstream[]) => plan.find((w) => w.id === ENGINE_WORKSTREAM_ID)!;

function withEngine(state: AssessmentState, patch: Partial<AssessmentState["engineAssessment"]>): AssessmentState {
  return { ...state, engineAssessment: { ...state.engineAssessment, ...patch } };
}

describe("Engine 2.0 effort", () => {
  const base = withEngine(initialAssessment(), { sharedCore: estimate(10, "low"), separatePrime: estimate(30, "high") });
  const engineFor = (patch: Partial<AssessmentState["engineAssessment"]>) => {
    const state = withEngine(base, patch);
    return engineOf(applyEngineEstimate(state.plan, state.engineAssessment));
  };

  it("follows recommendedPath, not engineClassification", () => {
    expect(engineFor({ engineClassification: "rewrite", recommendedPath: "shared" }).personDays).toBe(10);
    expect(engineFor({ engineClassification: "reuse", recommendedPath: "separate" }).personDays).toBe(30);
    expect(engineFor({ engineClassification: "reuse", recommendedPath: "separate" }).risk).toBe("high");
    expect(engineFor({ engineClassification: "rewrite", recommendedPath: "" }).personDays).toBe(0);
  });

  it("is recalculated when a saved draft is loaded", () => {
    const saved = withEngine(base, { recommendedPath: "separate" });
    const plan = saved.plan.map((w) => (w.id === ENGINE_WORKSTREAM_ID ? { ...w, personDays: 99 } : w));

    expect(engineOf(hydrateAssessment({ ...saved, plan }).plan).personDays).toBe(30);
  });
});

describe("scope profile", () => {
  const classify = (plan: Workstream[], ids: Record<string, Workstream["classification"]>, days = 2) =>
    plan.map((w) => (w.id in ids ? { ...w, classification: ids[w.id], personDays: days } : w));

  it("separates game and platform workstreams", () => {
    const plan = classify(initialAssessment().plan, { "core-gameplay": "reuse", "prime-ui": "refactor", qa: "new", "score-results": "extend" });
    const profile = scopeProfile(plan);
    const row = (group: "game" | "platform", c: string) => profile[group].rows.find((r) => r.classification === c)!;

    expect(row("game", "refactor")).toEqual({ classification: "refactor", count: 1, days: 2 });
    expect(row("game", "new").count).toBe(0);
    expect(row("platform", "new")).toEqual({ classification: "new", count: 1, days: 2 });
    expect(row("platform", "extend").days).toBe(2);
    expect(profile.platform.count).toBe(4);
    expect(profile.game.count).toBe(9);
  });

  it("shows Incomplete while any workstream is unclassified", () => {
    const plan = initialAssessment().plan.map((w) => ({ ...w, classification: "reuse" as const }));
    const oneOpen = plan.map((w, i) => (i === 0 ? { ...w, classification: "" as const } : w));

    expect(scopeProfile(plan).incomplete).toBeNull();
    expect(scopeProfile(oneOpen).incomplete).toBe("Incomplete — 1 workstream not classified");
    expect(scopeProfile(initialAssessment().plan).incomplete).toMatch(/^Incomplete — \d+ workstreams not classified$/);
  });
});

describe("engineAssessmentIssues", () => {
  it("requires a recommended path and a justification", () => {
    const issues = engineAssessmentIssues(initialAssessment().engineAssessment);

    expect(issues).toContain("Select a recommended path");
    expect(issues).toContain("Explain why this path was recommended");
  });

  it("asks what leads to a Rewrite only when the engine is classified Rewrite", () => {
    const engine = initialAssessment().engineAssessment;

    expect(engineAssessmentIssues({ ...engine, engineClassification: "refactor" }).join()).not.toContain("leads to this recommendation");
    expect(engineAssessmentIssues({ ...engine, engineClassification: "rewrite" })).toContain("Describe what in the current code leads to this recommendation.");
  });
});

describe("hydrating saved states", () => {
  it("drops discovery answers, which now live in each developer's response", () => {
    const saved = { ...initialAssessment(), answers: { A1: { text: "2021" } } };

    expect(hydrateAssessment(saved)).not.toHaveProperty("answers");
  });

  it("maps the removed 'discovery-submitted' status (and other old values) to discovery", () => {
    ["discovery-submitted", "draft", "planning", "approved"].forEach((status) => {
      expect(hydrateAssessment({ status }).status).toBe("discovery");
    });
    expect(hydrateAssessment({ status: "findings" }).status).toBe("findings");
  });

  it("clears classifications that no longer exist", () => {
    expect([migrateClassification("modify"), migrateClassification("rewrite"), migrateClassification(undefined)]).toEqual(["", "rewrite", ""]);
  });
});
