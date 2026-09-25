import { describe, expect, it } from "vitest";
import { initialAssessment } from "./assessment";
import { DISCOVERY_QUESTIONS, DISCOVERY_SECTIONS } from "./discovery";
import { emptyAnswer } from "./discoveryAnswers";
import { ALL_DEVELOPERS, discoveryFileName, slugify } from "./download";
import { buildDiscoveryMarkdown, toExportResponse } from "./exportMarkdown";
import { DiscoveryResponseData, viewAnswersTarget } from "./responses";

const open = DISCOVERY_QUESTIONS.find((q) => q.type === "open")!;
const response = (id: string, name: string, text: string, submittedAt: string | null): DiscoveryResponseData => ({
  id,
  profileId: `profile-${id}`,
  developerName: name,
  status: submittedAt ? "submitted" : "in-progress",
  submittedAt,
  answers: { [open.id]: { ...emptyAnswer(), text } },
  version: 3,
});
const alex = response("11111111-1111-4111-8111-111111111111", "Alex", "Alex uses GameManager", "2026-09-26T09:30:00Z");
const sam = response("22222222-2222-4222-8222-222222222222", "Sam", "Sam uses separate boards", null);
const state = { ...initialAssessment(), gameInfo: { gameName: "Bubble Shooter PvP", developer: "Porting team" } };

describe("per-developer export", () => {
  const md = buildDiscoveryMarkdown(state, [toExportResponse(alex)], new Date("2026-09-27T08:00:00Z"));

  it("has the header fields", () => {
    expect(md).toContain("# Prime discovery — Bubble Shooter PvP");
    expect(md).toContain("- Developer: Alex");
    expect(md).toContain("- Status: submitted");
    expect(md).toContain("- Submitted: 2026-09-26");
    expect(md).toContain("_Exported 2026-09-27_");
    expect(md).toContain("## Open items");
  });

  it("contains only that developer's answers, and no internal ids", () => {
    expect(md).toContain("Alex uses GameManager");
    expect(md).not.toContain("Sam");
    expect(md).not.toContain(alex.id);
    expect(md).not.toContain(alex.profileId);
    expect(md).not.toContain("@");
  });

  it("says when a response isn't submitted yet", () => {
    expect(buildDiscoveryMarkdown(state, [toExportResponse(sam)])).toContain("- Submitted: Not submitted yet");
    expect(buildDiscoveryMarkdown(state, [toExportResponse(sam)])).toContain("- Status: in progress");
  });

  it("the combined export still lists every developer", () => {
    const all = buildDiscoveryMarkdown(state, [alex, sam].map(toExportResponse));

    expect(all).toContain("- Answers from: Alex (submitted), Sam (in progress)");
    expect(all).toContain("- Alex (submitted): Alex uses GameManager");
    expect(all).toContain("- Sam (in progress): Sam uses separate boards");
  });
});

describe("export file names", () => {
  const date = new Date("2026-09-26T12:00:00Z");

  it("are lower-case with hyphens and safe characters only", () => {
    expect(discoveryFileName("Bubble Shooter PvP", "Alex Smith", date)).toBe("bubble-shooter-pvp-alex-smith-discovery-2026-09-26.md");
    expect(discoveryFileName("Zoë's  Game!!", "../../etc/passwd", date)).toBe("zo-s-game-etc-passwd-discovery-2026-09-26.md");
    expect(discoveryFileName("Bubble Shooter PvP", ALL_DEVELOPERS, date)).toBe("bubble-shooter-pvp-all-developers-discovery-2026-09-26.md");
  });

  it("fall back when nothing safe is left", () => {
    expect(slugify("***", "game")).toBe("game");
    expect(discoveryFileName("", "", date)).toBe("game-developer-discovery-2026-09-26.md");
  });
});

describe("View answers", () => {
  it("selects that developer and opens section A", () => {
    expect(viewAnswersTarget(sam.id)).toEqual({ viewingId: sam.id, view: DISCOVERY_SECTIONS[0].title });
  });
});
