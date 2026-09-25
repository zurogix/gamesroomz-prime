import { describe, expect, it } from "vitest";
import { initialAssessment } from "./assessment";
import { choices, DISCOVERY_QUESTIONS } from "./discovery";
import { emptyAnswer, isAnswered, NOT_SURE_ID, OTHER_ID, toggleOption, withAutoOptions } from "./discoveryAnswers";
import { DiscoveryQuestion, QuestionAnswer } from "./discoveryTypes";
import { buildDiscoveryMarkdown } from "./exportMarkdown";

const question = (id: string) => DISCOVERY_QUESTIONS.find((q) => q.id === id) as DiscoveryQuestion;
const answer = (patch: Partial<QuestionAnswer>): QuestionAnswer => ({ ...emptyAnswer(), ...patch });

describe("discovery data", () => {
  it("has 21 multiple-choice and 7 open questions", () => {
    const open = DISCOVERY_QUESTIONS.filter((q) => q.type === "open");
    const multipleChoice = DISCOVERY_QUESTIONS.filter((q) => q.type !== "open");

    expect(multipleChoice).toHaveLength(21);
    expect(open).toHaveLength(7);
  });

  it("uses unique question ids", () => {
    const ids = DISCOVERY_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("exclusive options", () => {
  const options = withAutoOptions(choices(["player", "board", "None of these"]));

  it("clears other options when Not sure is chosen", () => {
    expect(toggleOption(["player", "board"], NOT_SURE_ID, options, "multi")).toEqual([NOT_SURE_ID]);
  });

  it("clears other options when None of these is chosen", () => {
    expect(toggleOption(["player", OTHER_ID], "none-of-these", options, "multi")).toEqual(["none-of-these"]);
  });

  it("clears Not sure and None of these when a substantive option is chosen", () => {
    expect(toggleOption([NOT_SURE_ID], "board", options, "multi")).toEqual(["board"]);
    expect(toggleOption(["none-of-these"], OTHER_ID, options, "multi")).toEqual([OTHER_ID]);
  });

  it("allows several substantive options in multi mode but one in single mode", () => {
    expect(toggleOption(["player"], "board", options, "multi")).toEqual(["player", "board"]);
    expect(toggleOption(["player"], "board", options, "single")).toEqual(["board"]);
    expect(toggleOption(["board"], "board", options, "single")).toEqual([]);
  });
});

describe("answered logic", () => {
  it("single and multi need a choice, and Not sure counts", () => {
    expect(isAnswered(question("A1"), emptyAnswer())).toBe(false);
    expect(isAnswered(question("A1"), answer({ choice: { selected: ["2021"], other: "" } }))).toBe(true);
    expect(isAnswered(question("A2"), answer({ choice: { selected: [NOT_SURE_ID], other: "" } }))).toBe(true);
  });

  it("rows need a choice on every row", () => {
    const partial = answer({ rows: { pause: { selected: ["per-board-pause"], other: "" } } });
    const complete = answer({ rows: { ...partial.rows, timed: { selected: [NOT_SURE_ID], other: "" } } });

    expect(isAnswered(question("B3"), partial)).toBe(false);
    expect(isAnswered(question("B3"), complete)).toBe(true);
  });

  it("open questions need text, or Not sure yet with what needs checking", () => {
    expect(isAnswered(question("C6"), answer({ text: "  " }))).toBe(false);
    expect(isAnswered(question("C6"), answer({ text: "AttackManager decides" }))).toBe(true);
    expect(isAnswered(question("C6"), answer({ notSureYet: true }))).toBe(false);
    expect(isAnswered(question("C6"), answer({ notSureYet: true, needsChecking: "Read AttackManager" }))).toBe(true);
  });
});

describe("Markdown export", () => {
  const answers = {
    A1: answer({ choice: { selected: ["2021"], other: "" }, basis: "assumption" as const, confirmBy: "Open the project" }),
    A2: answer({ choice: { selected: [OTHER_ID], other: "Nakama" } }),
    C2: answer({ choice: { selected: [NOT_SURE_ID], other: "" } }),
  };
  const md = buildDiscoveryMarkdown(initialAssessment(), [{ name: "Alex", status: "submitted", answers }], new Date("2026-09-25T00:00:00Z"));

  it("includes every question id", () => {
    DISCOVERY_QUESTIONS.forEach((q) => expect(md).toContain(`### ${q.id} · `));
  });

  it("includes selected options, Other text, basis and what would confirm it", () => {
    expect(md).toContain("**Answer:** 2021");
    expect(md).toContain("Other: Nakama");
    expect(md).toContain("- Basis: Assumption");
    expect(md).toContain("- What would confirm it: Open the project");
  });

  it("ends with the unanswered and Not sure list", () => {
    const tail = md.slice(md.indexOf("## Unanswered / Not sure"));

    expect(tail).toContain("- C2 · On each phone, how is the opponent's board produced? (Not sure)");
    expect(tail).toContain("- I4 · What information from us would help you estimate with more confidence? (not answered)");
    expect(tail).not.toContain("- A1 ·");
  });
});
