import { describe, expect, it } from "vitest";
import { DISCOVERY_QUESTIONS, DISCOVERY_SECTIONS } from "./discovery";
import { railKindFor } from "./rail";
import { OVERVIEW, PLAN, SUMMARY } from "./sections";

describe("section tips data", () => {
  it("gives every discovery question a non-empty title and why", () => {
    DISCOVERY_QUESTIONS.forEach((q) => {
      expect(q.title.trim(), q.id).not.toBe("");
      expect(q.why.trim(), q.id).not.toBe("");
    });
  });

  it("gives every section a non-empty intro", () => {
    DISCOVERY_SECTIONS.forEach((s) => expect(s.intro.trim(), s.id).not.toBe(""));
  });

  it("uses the agreed wording", () => {
    const b2 = DISCOVERY_QUESTIONS.find((q) => q.id === "B2")!;
    expect(DISCOVERY_SECTIONS[0].intro).toBe("Sets the technical starting point.");
    expect(b2.why).toBe("Prime runs two boards in one game. A manager holding one 'current' player, board or score may need changes; a shared service usually doesn't.");
  });
});

describe("rail by view", () => {
  it("shows tips on every discovery section", () => {
    DISCOVERY_SECTIONS.forEach((s) => expect(railKindFor(s.title)).toBe("discovery"));
  });

  it("shows progress on the overview, the plan summary on the plan, and nothing on the summary", () => {
    expect(railKindFor(OVERVIEW)).toBe("overview");
    expect(railKindFor(PLAN)).toBe("plan");
    expect(railKindFor(SUMMARY)).toBe("none");
  });
});
