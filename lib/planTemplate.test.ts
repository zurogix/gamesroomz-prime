import { describe, expect, it } from "vitest";
import { hydrateAssessment, initialAssessment } from "./assessment";
import { LEGACY_TEMPLATE_DEFAULTS } from "./legacyTemplateDefaults";
import { planTemplate } from "./planTemplate";
import { Workstream } from "./types";

const ENGINE_EXCLUSION = "Excludes core engine refactoring already estimated in Multiplayer Engine 2.0.";
const EXCLUSION_IDS = ["player-controller", "networking", "multi-touch"];

const byId = (plan: Workstream[], id: string) => plan.find((w) => w.id === id)!;

function hydrateWith(id: string, patch: Partial<Workstream>) {
  const base = initialAssessment();
  const plan = base.plan.map((w) => (w.id === id ? { ...w, ...patch } : w));
  return byId(hydrateAssessment({ ...base, plan }).plan, id);
}

describe("plan template", () => {
  it("leaves current-game fields empty", () => {
    planTemplate.forEach((w) => {
      expect(w.currentImplementation).toBe("");
      expect(w.reusedComponents).toBe("");
    });
  });

  it("keeps only the engine exclusion in changedComponents for three workstreams", () => {
    planTemplate.forEach((w) => {
      expect(w.changedComponents).toBe(EXCLUSION_IDS.includes(w.id) ? ENGINE_EXCLUSION : "");
    });
  });

  it("keeps requirements, deliverables and dependencies", () => {
    planTemplate.forEach((w) => {
      expect(w.primeRequirement).not.toBe("");
      expect(w.deliverable).not.toBe("");
      expect(w.dependencies).not.toBe("");
    });
    expect(byId(planTemplate, "prime-ui").primeRequirement).toBe(
      "Tabletop layout as defined in Prime targets; opposite player UI may require 180° orientation."
    );
  });
});

describe("hydrating saved plan text", () => {
  it("clears every unchanged old default", () => {
    Object.entries(LEGACY_TEMPLATE_DEFAULTS).forEach(([id, fields]) => {
      const template = byId(planTemplate, id);
      Object.entries(fields).forEach(([field, values]) => {
        values?.forEach((oldDefault) => {
          const hydrated = hydrateWith(id, { [field]: oldDefault });
          expect(hydrated[field as keyof Workstream]).toBe(template[field as keyof Workstream]);
        });
      });
    });
  });

  it("replaces an old default with the engine exclusion where the template keeps it", () => {
    const hydrated = hydrateWith("networking", {
      changedComponents: `Remove unnecessary same-table move synchronization and decouple local match logic from remote-player assumptions.\n${ENGINE_EXCLUSION}`,
    });

    expect(hydrated.changedComponents).toBe(ENGINE_EXCLUSION);
  });

  it("keeps text the user edited", () => {
    const edited = "Legacy Unity mobile project with complete source code. Opened fine in 2021.3.";
    const hydrated = hydrateWith("technical-investigation", {
      currentImplementation: edited,
      reusedComponents: "BubbleGrid and MatchResolver",
    });

    expect(hydrated.currentImplementation).toBe(edited);
    expect(hydrated.reusedComponents).toBe("BubbleGrid and MatchResolver");
  });

  it("keeps an edited prime requirement", () => {
    const hydrated = hydrateWith("prime-ui", { primeRequirement: "Two portrait boards side by side, P2 rotated." });

    expect(hydrated.primeRequirement).toBe("Two portrait boards side by side, P2 rotated.");
  });
});
