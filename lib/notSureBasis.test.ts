import { describe, expect, it } from "vitest";
import { initialAssessment } from "./assessment";
import { DISCOVERY_QUESTIONS } from "./discovery";
import { emptyAnswer, isEntirelyNotSure, normalizeAnswer, normalizeAnswers, NOT_SURE_ID, showsBasis } from "./discoveryAnswers";
import { DiscoveryQuestion, QuestionAnswer } from "./discoveryTypes";
import { buildDiscoveryMarkdown } from "./exportMarkdown";

const byType = (type: DiscoveryQuestion["type"]) => DISCOVERY_QUESTIONS.find((q) => q.type === type)!;
const withBasis = (a: QuestionAnswer): QuestionAnswer => ({ ...a, basis: "assumption", confirmBy: "Open the project" });
const choose = (...selected: string[]) => withBasis({ ...emptyAnswer(), choice: { selected, other: "" } });
const firstOption = (q: DiscoveryQuestion) => (q.type === "single" || q.type === "multi" ? q.options[0].id : "");
const rowsAnswer = (q: DiscoveryQuestion, pick: (i: number) => string) =>
  q.type === "rows" ? withBasis({ ...emptyAnswer(), rows: Object.fromEntries(q.rows.map((r, i) => [r.id, { selected: [pick(i)], other: "" }])) }) : emptyAnswer();

const cases: [string, DiscoveryQuestion, QuestionAnswer][] = [
  ["single", byType("single"), choose(NOT_SURE_ID)],
  ["multi", byType("multi"), choose(NOT_SURE_ID)],
  ["open", byType("open"), withBasis({ ...emptyAnswer(), notSureYet: true })],
];

describe("Not sure answers have no basis", () => {
  it.each(cases)("%s: basis hidden and cleared", (_, q, a) => {
    expect(isEntirelyNotSure(q, a)).toBe(true);
    expect(showsBasis(q, a)).toBe(false);
    expect(normalizeAnswer(q, a)).toMatchObject({ basis: "", confirmBy: "" });
  });

  it("keeps the basis for a real answer", () => {
    const q = byType("single");
    const a = choose(firstOption(q));

    expect(showsBasis(q, a)).toBe(true);
    expect(normalizeAnswer(q, a)).toBe(a);
  });

  it("keeps the basis on a rows question with at least one real answer, hides it when every row is Not sure", () => {
    const q = byType("rows");
    const firstReal = (i: number) => (q.type === "rows" && i === 0 ? q.rows[0].options[0].id : NOT_SURE_ID);

    expect(showsBasis(q, rowsAnswer(q, firstReal))).toBe(true);
    expect(normalizeAnswer(q, rowsAnswer(q, firstReal)).basis).toBe("assumption");
    expect(showsBasis(q, rowsAnswer(q, () => NOT_SURE_ID))).toBe(false);
    expect(normalizeAnswer(q, rowsAnswer(q, () => NOT_SURE_ID)).basis).toBe("");
  });

  it("clears leftovers across a whole answer set (as the save route does)", () => {
    const q = byType("single");
    const cleaned = normalizeAnswers({ [q.id]: choose(NOT_SURE_ID), unknown: undefined });

    expect(cleaned[q.id]).toMatchObject({ basis: "", confirmBy: "" });
  });
});

describe("export of Not sure answers", () => {
  const single = byType("single");
  const open = byType("open");
  const md = buildDiscoveryMarkdown(initialAssessment(), [{
    name: "Alex",
    status: "submitted",
    answers: {
      // Stored before the rule existed: a basis is still present.
      [single.id]: { ...choose(NOT_SURE_ID), needsChecking: "Search for GameManager" },
      [open.id]: withBasis({ ...emptyAnswer(), notSureYet: true }),
    },
  }]);
  const block = (q: DiscoveryQuestion) => md.slice(md.indexOf(`### ${q.id} · `)).split("\n### ")[0];

  it("shows Not sure with the note and no basis line", () => {
    expect(block(single)).toContain("**Answer:** Not sure");
    expect(block(single)).toContain("- Would need to check: Search for GameManager");
    expect(block(single)).not.toContain("Basis:");
    expect(block(single)).not.toContain("How could this be checked");
    expect(block(open)).toContain("Not sure yet");
    expect(block(open)).not.toContain("Basis:");
  });

  it("still lists Not sure answers as open items", () => {
    expect(md.slice(md.indexOf("## Open items"))).toContain(`- ${single.id} · ${single.prompt} (Not sure)`);
  });
});
