import { describe, expect, it } from "vitest";
import { applyEngineEstimate, engineAssessmentIssues, hydrateAssessment, initialAssessment } from "./assessment";
import { LEGACY_STORAGE_KEY, readDraft, STORAGE_KEY } from "./draftStorage";
import { ENGINE_WORKSTREAM_ID } from "./engine";
import { LegacyDraft, migrateV1Draft } from "./migrate";
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

describe("v1 → v2 migration", () => {
  const legacy: LegacyDraft = {
    gameInfo: { gameName: "Bubble Shooter PvP", developer: "Porting team" },
    responses: {
      "pvp-controller": { answer: "no", classification: "modify", explanation: "Singleton", effortDays: 5 },
    },
    plan: [
      { id: "unity-modernization", classification: "modify", whyChange: "Old Unity", personDays: 6 },
      { id: "core-gameplay", classification: "reuse" },
      {
        id: "multiplayer-architecture",
        classification: "rewrite",
        currentImplementation: "Online mobile PvP: typically one local player per device and one remote opponent.",
        proposedImplementation: "Introduce a SeatId-keyed PlayerContext.",
      },
    ],
    engineAssessment: { strategy: "replace", replaceReason: "Photon everywhere", sharedCore: estimate(12, "medium") },
    status: "approved",
    checks: [true, false, true],
  };
  const state = hydrateAssessment(migrateV1Draft(legacy));
  const workstream = (id: string) => state.plan.find((w) => w.id === id)!;

  it("keeps game info, plan text, engine estimates and checks", () => {
    expect(state.gameInfo.developer).toBe("Porting team");
    expect(workstream("unity-modernization").whyChange).toBe("Old Unity");
    expect(state.engineAssessment.sharedCore.coreOrBuildDays).toBe(12);
    expect(state.checks.slice(0, 3)).toEqual([true, false, true]);
  });

  it("maps labels, engine strategy and status", () => {
    expect(workstream("unity-modernization").classification).toBe("");
    expect(workstream("core-gameplay").classification).toBe("reuse");
    expect(state.engineAssessment.engineClassification).toBe("rewrite");
    expect(state.engineAssessment.recommendedPath).toBe("");
    expect(state.engineAssessment.rewriteReason).toBe("Photon everywhere");
    expect(state.engineAssessment).not.toHaveProperty("strategy");
    expect(state.engineAssessment).not.toHaveProperty("replaceReason");
    expect(state.status).toBe("discovery");
  });

  it("maps every old engine strategy", () => {
    const map = (strategy: string) => migrateV1Draft({ engineAssessment: { strategy } }).engineAssessment?.engineClassification;

    expect([map("reuse"), map("extend"), map("refactor"), map("replace")]).toEqual(["reuse", "extend", "refactor", "rewrite"]);
  });

  it("moves developer text from multiplayer-architecture into multiplayer-engine-2", () => {
    const template = engineOf(initialAssessment().plan);

    expect(state.plan.some((w) => w.id === "multiplayer-architecture")).toBe(false);
    expect(workstream(ENGINE_WORKSTREAM_ID).proposedImplementation).toBe("Introduce a SeatId-keyed PlayerContext.");
    expect(workstream(ENGINE_WORKSTREAM_ID).currentImplementation).toBe(template.currentImplementation);
  });

  it("drops Yes/No responses and per-question effort", () => {
    expect(state.answers).toEqual({});
    expect(state).not.toHaveProperty("responses");
  });

  it("migrates from v1 only when no v2 draft exists, and flags the notice", () => {
    const storage = (items: Record<string, string>) => ({ getItem: (key: string) => items[key] ?? null });
    const fromV1 = readDraft(storage({ [LEGACY_STORAGE_KEY]: JSON.stringify(legacy) }));
    const fromV2 = readDraft(storage({ [STORAGE_KEY]: JSON.stringify(initialAssessment()), [LEGACY_STORAGE_KEY]: JSON.stringify(legacy) }));

    expect(fromV1?.migrated).toBe(true);
    expect(fromV1?.state.gameInfo.developer).toBe("Porting team");
    expect(fromV2?.migrated).toBe(false);
  });

  it("flags a v2 draft that still holds Yes/No responses", () => {
    const storage = { getItem: (key: string) => (key === STORAGE_KEY ? JSON.stringify({ ...initialAssessment(), answers: undefined, responses: {} }) : null) };

    expect(readDraft(storage)?.migrated).toBe(true);
  });
});
