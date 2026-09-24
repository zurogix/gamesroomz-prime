import { describe, expect, it } from "vitest";
import {
  applyEngineEstimate,
  calculateComplexity,
  engineAssessmentIssues,
  gameQuestions,
  initialAssessment,
  syncPlanFromAssessment,
} from "./assessment";
import { readDraft, LEGACY_STORAGE_KEY, STORAGE_KEY } from "./draftStorage";
import { ENGINE_WORKSTREAM_ID } from "./engine";
import { migrateV1Draft, LegacyDraft } from "./migrate";
import { questions } from "./questions";
import { AssessmentState, Classification, EngineOptionEstimate } from "./types";

const platformQuestions = questions.filter((q) => q.category === "platform");

function classify(state: AssessmentState, ids: string[], classification: Classification): AssessmentState {
  const responses = { ...state.responses };
  ids.forEach((id) => {
    responses[id] = { ...responses[id], answer: "yes", classification };
  });
  return { ...state, responses };
}

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

function engineWorkstream(state: AssessmentState) {
  return state.plan.find((w) => w.id === ENGINE_WORKSTREAM_ID)!;
}

function withEngine(state: AssessmentState, patch: Partial<AssessmentState["engineAssessment"]>): AssessmentState {
  return { ...state, engineAssessment: { ...state.engineAssessment, ...patch } };
}

describe("calculateComplexity", () => {
  it("ignores platform questions", () => {
    const allGameReuse = classify(initialAssessment(), gameQuestions.map((q) => q.id), "reuse");
    const withHeavyPlatform = classify(allGameReuse, platformQuestions.map((q) => q.id), "rewrite");

    expect(platformQuestions.length).toBeGreaterThan(0);
    expect(calculateComplexity(withHeavyPlatform)).toEqual(calculateComplexity(allGameReuse));
    expect(calculateComplexity(withHeavyPlatform).level).toBe("minor");
  });

  it("returns Incomplete when any game question is unclassified", () => {
    const ids = gameQuestions.map((q) => q.id);
    const oneMissing = classify(initialAssessment(), ids.slice(1), "reuse");
    const result = calculateComplexity(oneMissing);

    expect(result.level).toBe("incomplete");
    expect(result.label).toBe("Incomplete — 1 question not classified");
    expect(calculateComplexity(initialAssessment()).label).toBe(`Incomplete — ${ids.length} questions not classified`);
  });
});

describe("syncPlanFromAssessment", () => {
  const assessed = () => {
    const base = classify(initialAssessment(), ["pvp-controller", "touch-multi", "gameplay-core"], "refactor");
    const responses = {
      ...base.responses,
      "pvp-controller": { ...base.responses["pvp-controller"], explanation: "Controller is a singleton." },
    };
    return withEngine({ ...base, responses }, {
      engineClassification: "refactor",
      recommendedPath: "shared",
      pathJustification: "Lower maintenance than two engines.",
      migrationPlan: "Separate state from transport first.",
      reusableComponents: "Board, scoring and attack rules.",
      sharedCore: estimate(12, "medium"),
      separatePrime: estimate(30, "high"),
    });
  };

  it("returns identical output when run twice", () => {
    const state = assessed();
    const once = syncPlanFromAssessment(state);
    const twice = syncPlanFromAssessment({ ...state, plan: once });

    expect(twice).toEqual(once);
  });

  it("never overwrites developer-written text", () => {
    const state = assessed();
    const plan = state.plan.map((w) => {
      if (w.id === "player-controller") return { ...w, whyChange: "Developer reason" };
      if (w.id === ENGINE_WORKSTREAM_ID) {
        return { ...w, proposedImplementation: "Developer plan", reusedComponents: "Developer reuse list" };
      }
      return w;
    });
    const synced = syncPlanFromAssessment({ ...state, plan });
    const controller = synced.find((w) => w.id === "player-controller")!;
    const engine = synced.find((w) => w.id === ENGINE_WORKSTREAM_ID)!;

    expect(controller.whyChange).toBe("Developer reason");
    expect(engine.proposedImplementation).toBe("Developer plan");
    expect(engine.reusedComponents).toBe("Developer reuse list");
  });

  it("fills empty text fields from the assessment", () => {
    const synced = syncPlanFromAssessment(assessed());
    const controller = synced.find((w) => w.id === "player-controller")!;
    const engine = synced.find((w) => w.id === ENGINE_WORKSTREAM_ID)!;

    expect(controller.whyChange).toBe("Controller is a singleton.");
    expect(engine.proposedImplementation).toBe("Separate state from transport first.");
    expect(engine.reusedComponents).toBe("Board, scoring and attack rules.");
  });

  it("does not append framework or state model to dependencies", () => {
    const state = withEngine(assessed(), { networkingFramework: "Photon PUN 2", stateUpdateModel: "Event sync" });
    const engine = syncPlanFromAssessment(state).find((w) => w.id === ENGINE_WORKSTREAM_ID)!;

    expect(engine.dependencies).toBe(engineWorkstream(initialAssessment()).dependencies);
  });
});

describe("Engine 2.0 effort", () => {
  it("follows recommendedPath, not engineClassification", () => {
    const base = withEngine(initialAssessment(), { sharedCore: estimate(10, "low"), separatePrime: estimate(30, "high") });
    const daysFor = (patch: Partial<AssessmentState["engineAssessment"]>) => {
      const state = withEngine(base, patch);
      return syncPlanFromAssessment(state).find((w) => w.id === ENGINE_WORKSTREAM_ID)!;
    };

    expect(daysFor({ engineClassification: "rewrite", recommendedPath: "shared" }).personDays).toBe(10);
    expect(daysFor({ engineClassification: "reuse", recommendedPath: "separate" }).personDays).toBe(30);
    expect(daysFor({ engineClassification: "reuse", recommendedPath: "separate" }).risk).toBe("high");
    expect(daysFor({ engineClassification: "rewrite", recommendedPath: "" }).personDays).toBe(0);
  });

  it("is recalculated whenever the engine estimate changes", () => {
    const state = withEngine(initialAssessment(), { recommendedPath: "shared", sharedCore: estimate(8, "medium") });
    const plan = applyEngineEstimate(state.plan, state.engineAssessment);

    expect(plan.find((w) => w.id === ENGINE_WORKSTREAM_ID)!.personDays).toBe(8);
  });
});

describe("v1 → v2 migration", () => {
  const legacy: LegacyDraft = {
    responses: {
      "health-open": { answer: "yes", classification: "reuse", explanation: "Opens fine", effortDays: 2 },
      "pvp-controller": { answer: "no", classification: "modify", explanation: "Singleton", effortDays: 5 },
    },
    plan: [
      { id: "unity-modernization", classification: "modify", whyChange: "Old Unity" },
      { id: "core-gameplay", classification: "reuse" },
      {
        id: "multiplayer-architecture",
        classification: "rewrite",
        currentImplementation: "Online mobile PvP: typically one local player per device and one remote opponent.",
        proposedImplementation: "Introduce a SeatId-keyed PlayerContext.",
      },
    ],
    engineAssessment: { strategy: "replace", replaceReason: "Photon everywhere", networkingFramework: "Photon" },
  };

  it("maps labels and fields as specified", () => {
    const migrated = migrateV1Draft(legacy);

    expect(migrated.responses?.["health-open"]).toEqual({ answer: "yes", classification: "reuse", explanation: "Opens fine" });
    expect(migrated.responses?.["pvp-controller"]?.classification).toBe("");
    expect(migrated.plan?.find((w) => w.id === "unity-modernization")?.classification).toBe("");
    expect(migrated.plan?.find((w) => w.id === "core-gameplay")?.classification).toBe("reuse");
    expect(migrated.plan?.some((w) => w.id === "multiplayer-architecture")).toBe(false);
    expect(migrated.engineAssessment).toMatchObject({
      engineClassification: "rewrite",
      recommendedPath: "",
      rewriteReason: "Photon everywhere",
      networkingFramework: "Photon",
    });
    expect(migrated.engineAssessment).not.toHaveProperty("strategy");
    expect(migrated.engineAssessment).not.toHaveProperty("replaceReason");
  });

  it("maps every old engine strategy", () => {
    const map = (strategy: string) => migrateV1Draft({ engineAssessment: { strategy } }).engineAssessment?.engineClassification;

    expect(map("reuse")).toBe("reuse");
    expect(map("extend")).toBe("extend");
    expect(map("refactor")).toBe("refactor");
    expect(map("replace")).toBe("rewrite");
  });

  it("appends developer text from the retired multiplayer-architecture workstream", () => {
    const engine = migrateV1Draft(legacy).plan?.find((w) => w.id === ENGINE_WORKSTREAM_ID);
    const template = engineWorkstream(initialAssessment());

    expect(engine?.proposedImplementation).toBe("Introduce a SeatId-keyed PlayerContext.");
    expect(engine?.currentImplementation).toBe(template.currentImplementation);
  });

  it("loads a v1 draft only when no v2 draft exists", () => {
    const storage = (items: Record<string, string>) => ({ getItem: (key: string) => items[key] ?? null });
    const fromV1 = readDraft(storage({ [LEGACY_STORAGE_KEY]: JSON.stringify(legacy) }));

    expect(fromV1?.migrated).toBe(true);
    expect(fromV1?.state.responses["pvp-controller"]).toEqual({ answer: "no", classification: "", explanation: "Singleton" });

    const v2 = JSON.stringify(initialAssessment());
    const fromV2 = readDraft(storage({ [STORAGE_KEY]: v2, [LEGACY_STORAGE_KEY]: JSON.stringify(legacy) }));
    expect(fromV2?.migrated).toBe(false);
  });
});

describe("engineAssessmentIssues", () => {
  it("requires a recommended path and a justification", () => {
    const issues = engineAssessmentIssues(initialAssessment().engineAssessment);

    expect(issues).toContain("Select a recommended path");
    expect(issues).toContain("Explain why this path was recommended");
  });

  it("clears both issues once a path is chosen and justified", () => {
    const engine = { ...initialAssessment().engineAssessment, recommendedPath: "separate" as const, pathJustification: "Lower risk." };
    const issues = engineAssessmentIssues(engine);

    expect(issues).not.toContain("Select a recommended path");
    expect(issues).not.toContain("Explain why this path was recommended");
  });

  it("asks for rewrite evidence only when the engine is classified Rewrite", () => {
    const base = initialAssessment().engineAssessment;

    expect(engineAssessmentIssues({ ...base, engineClassification: "refactor" }).join()).not.toContain("Rewrite decision");
    expect(engineAssessmentIssues({ ...base, engineClassification: "rewrite" })).toContain("A Rewrite decision requires a concrete technical reason.");
  });
});
