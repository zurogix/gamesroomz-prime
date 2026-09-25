import { describe, expect, it } from "vitest";
import { hydrateAssessment } from "./assessment";
import { hydratePrimeTargets } from "./hydratePrimeTargets";
import { assessmentStateSchema } from "./schemas/assessment";

const oldTargets = {
  unityVersion: "2022.3 LTS",
  androidApi: "",
  resolution: "1920x1080",
  layout: "Two playfields",
  layoutSketch: "https://example.com/sketch",
  fpsTarget: "  ",
  sdk: "",
  firstRelease: "Leaderboards",
  codebase: "shared",
  modes: ["same-device"],
  modesOther: "",
};

describe("Prime targets hydration", () => {
  it("converts old strings: non-empty becomes set, empty becomes blank", () => {
    const t = hydratePrimeTargets(oldTargets);

    expect(t.unityVersion).toEqual({ state: "set", value: "2022.3 LTS" });
    expect(t.androidApi).toEqual({ state: "", value: "" });
    expect(t.fpsTarget).toEqual({ state: "", value: "" });
    expect(t.firstRelease).toEqual({ state: "set", value: "Leaderboards" });
    expect(t.codebase).toBe("shared");
    expect(t.modes).toEqual(["same-device"]);
    expect(t).not.toHaveProperty("layoutSketch");
  });

  it("merges the old sketch link into the layout field", () => {
    expect(hydratePrimeTargets(oldTargets).layout).toEqual({ state: "set", value: "Two playfields", link: "https://example.com/sketch" });
    expect(hydratePrimeTargets({ layoutSketch: "https://x.test/s" }).layout).toEqual({ state: "", value: "", link: "https://x.test/s" });
  });

  it("keeps the current shape and drops 'agree with developer' where it is not offered", () => {
    const t = hydratePrimeTargets({
      unityVersion: { state: "agree-with-developer", value: "" },
      resolution: { state: "agree-with-developer", value: "" },
      layout: { state: "not-decided", value: "", link: "https://a.test" },
    });

    expect(t.unityVersion.state).toBe("agree-with-developer");
    expect(t.resolution.state).toBe("");
    expect(t.layout).toEqual({ state: "not-decided", value: "", link: "https://a.test" });
  });

  it("produces a valid state and drops removed game information fields", () => {
    const state = hydrateAssessment({
      gameInfo: { gameName: "Bubble", developer: "Team A", currentUnity: "2020.3", currentAndroidApi: "30" } as never,
      primeTargets: oldTargets,
    });

    expect(state.gameInfo).toEqual({ gameName: "Bubble", developer: "Team A" });
    expect(assessmentStateSchema.safeParse(state).success).toBe(true);
  });

  it("rejects 'agree with developer' for targets that do not offer it", () => {
    const state = hydrateAssessment({});
    const bad = { ...state, primeTargets: { ...state.primeTargets, fpsTarget: { state: "agree-with-developer" as const, value: "" } } };

    expect(assessmentStateSchema.safeParse(bad).success).toBe(false);
  });
});
