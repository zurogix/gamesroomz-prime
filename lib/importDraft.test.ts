import { describe, expect, it } from "vitest";
import { initialAssessment } from "./assessment";
import { LEGACY_STORAGE_KEY, STORAGE_KEY } from "./draftStorage";
import { clearLocalDrafts, prepareImport, readImportableDraft } from "./importDraft";
import { assessmentChangeError } from "./permissions";
import { assessmentStateSchema } from "./schemas/assessment";

const storageWith = (items: Record<string, string>) => ({ getItem: (key: string) => items[key] ?? null });

const v1Draft = {
  gameInfo: { gameName: "Bubble Shooter PvP", developer: "Porting team" },
  responses: { "pvp-controller": { answer: "no", classification: "modify", explanation: "Singleton", effortDays: 5 } },
  plan: [{ id: "unity-modernization", classification: "modify", whyChange: "Old Unity" }],
  engineAssessment: { strategy: "replace", replaceReason: "Photon everywhere" },
  status: "approved",
};

describe("local-draft import", () => {
  it("turns a v2 draft into a valid state", () => {
    const v2 = { ...initialAssessment(), primeTargets: { ...initialAssessment().primeTargets, fpsTarget: "60" } };
    const state = readImportableDraft(storageWith({ [STORAGE_KEY]: JSON.stringify(v2) }));

    expect(state).not.toBeNull();
    expect(assessmentStateSchema.safeParse(state).success).toBe(true);
    expect(state?.primeTargets.fpsTarget).toBe("60");
  });

  it("turns a v1 draft into a valid state via the existing migration", () => {
    const state = readImportableDraft(storageWith({ [LEGACY_STORAGE_KEY]: JSON.stringify(v1Draft) }));

    expect(assessmentStateSchema.safeParse(state).success).toBe(true);
    expect(state?.gameInfo.developer).toBe("Porting team");
    expect(state?.engineAssessment.engineClassification).toBe("rewrite");
    expect(state?.status).toBe("agreed");
  });

  it("returns null when there is no draft or it cannot be read", () => {
    expect(readImportableDraft(storageWith({}))).toBeNull();
    expect(readImportableDraft(storageWith({ [STORAGE_KEY]: "{not json" }))).toBeNull();
  });

  it("keeps product-only fields from the game when a developer imports", () => {
    const current = { ...initialAssessment(), gameInfo: { ...initialAssessment().gameInfo, gameName: "Server name" }, status: "planning" as const };
    const draft = { ...initialAssessment(), primeTargets: { ...current.primeTargets, fpsTarget: "30" }, status: "agreed" as const };
    const prepared = prepareImport(draft, current, "developer");

    expect(prepared.primeTargets).toEqual(current.primeTargets);
    expect(prepared.status).toBe("planning");
    expect(prepared.gameInfo.gameName).toBe("Server name");
    expect(assessmentChangeError("developer", current, prepared)).toBeNull();
    expect(prepareImport(draft, current, "product").status).toBe("agreed");
  });

  it("clears both local draft keys", () => {
    const removed: string[] = [];
    clearLocalDrafts({ removeItem: (key: string) => removed.push(key) });

    expect(removed).toEqual([STORAGE_KEY, LEGACY_STORAGE_KEY]);
  });
});
