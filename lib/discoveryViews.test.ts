import { describe, expect, it } from "vitest";
import { answerSummary } from "./answerText";
import { initialAssessment } from "./assessment";
import { clearPortalData } from "./browserData";
import { answersDiffer } from "./compareAnswers";
import { DISCOVERY_QUESTIONS } from "./discovery";
import { emptyAnswer, NOT_SURE_ID } from "./discoveryAnswers";
import { QuestionAnswer } from "./discoveryTypes";
import { buildDiscoveryMarkdown } from "./exportMarkdown";
import { publishFindingsNote } from "./responses";
import { stageSummary } from "./stages";

const question = (id: string) => DISCOVERY_QUESTIONS.find((q) => q.id === id)!;
const choose = (...selected: string[]): QuestionAnswer => ({ ...emptyAnswer(), choice: { selected, other: "" } });
const optionIds = (id: string) => {
  const q = question(id);
  return q.type === "single" || q.type === "multi" ? q.options.map((o) => o.id) : [];
};

describe("compare: Answers differ", () => {
  const [first, second] = optionIds("C2");

  it("flags different selected options", () => {
    expect(answersDiffer(question("C2"), [choose(first), choose(second)])).toBe(true);
    expect(answersDiffer(question("C2"), [choose(first), choose(NOT_SURE_ID)])).toBe(true);
  });

  it("does not flag the same options, in any order, or unanswered responses", () => {
    const [a, b] = optionIds("A2");

    expect(answersDiffer(question("C2"), [choose(first), choose(first)])).toBe(false);
    expect(answersDiffer(question("A2"), [choose(a, b), choose(b, a)])).toBe(false);
    expect(answersDiffer(question("C2"), [choose(first), emptyAnswer()])).toBe(false);
  });

  it("does not compare open (text) questions", () => {
    const open = DISCOVERY_QUESTIONS.find((q) => q.type === "open")!;

    expect(answersDiffer(open, [{ ...emptyAnswer(), text: "One" }, { ...emptyAnswer(), text: "Two" }])).toBe(false);
  });
});

describe("export with several developers", () => {
  const [first, second] = optionIds("C2");
  const md = buildDiscoveryMarkdown(initialAssessment(), [
    { name: "Alex", status: "submitted", answers: { C2: { ...choose(first), evidence: "BoardView.cs" } } },
    { name: "Sam", status: "in-progress", answers: { C2: choose(second) } },
  ]);
  const label = (id: string) => answerSummary(question("C2"), choose(id));

  it("lists each developer's answer under each question", () => {
    const block = md.slice(md.indexOf("### C2 · "), md.indexOf("### C3 · "));

    expect(block).toContain(`- Alex (submitted): ${label(first)}`);
    expect(block).toContain("  - Evidence: BoardView.cs");
    expect(block).toContain(`- Sam (in progress): ${label(second)}`);
    expect(md).toContain("- Answers from: Alex (submitted), Sam (in progress)");
  });

  it("names the developer in the open items", () => {
    expect(md).toContain("- C1 · How does the code tell 'me' from 'the opponent'? — Sam (not answered)");
  });

  it("says when nobody has started", () => {
    expect(buildDiscoveryMarkdown(initialAssessment(), [])).toContain("No developer has started discovery yet.");
  });
});

describe("publish findings dialog", () => {
  it("lists developers who haven't submitted, and blocks when nobody has", () => {
    expect(publishFindingsNote([{ developerName: "Alex", status: "submitted" }, { developerName: "Sam", status: "in-progress" }, { developerName: "Kim", status: "in-progress" }]))
      .toEqual({ blocked: false, text: "Sam and Kim haven't submitted. Publish findings anyway?" });
    expect(publishFindingsNote([{ developerName: "Alex", status: "submitted" }])).toBeNull();
    expect(publishFindingsNote([{ developerName: "Sam", status: "in-progress" }])?.blocked).toBe(true);
    expect(publishFindingsNote([])?.blocked).toBe(true);
  });
});

describe("progress box text", () => {
  it("shows a developer their own discovery in step 1", () => {
    expect(stageSummary("discovery", "in-progress")).toBe("Step 1: Discovery — Your discovery: in progress");
    expect(stageSummary("discovery", "submitted")).toBe("Step 1: Discovery — Your discovery: submitted, under review");
    expect(stageSummary("findings", "submitted")).toBe("Step 2: Findings & options — Findings & options, open for comments");
  });
});

describe("sign-out clearing", () => {
  function fakeStorage(entries: Record<string, string>) {
    const data = new Map(Object.entries(entries));
    return {
      data,
      get length() {
        return data.size;
      },
      key: (i: number) => [...data.keys()][i] ?? null,
      removeItem: (k: string) => void data.delete(k),
    };
  }

  it("removes backups and old drafts but keeps the theme", () => {
    const storage = fakeStorage({
      "gamesroomz-prime-backup-g1": "{}",
      "gamesroomz-prime-backup-g1-answers": "{}",
      "gamesroomz-prime-assessment-v1": "{}",
      "gamesroomz-prime-assessment-v2": "{}",
      "gamesroomz-prime-theme": "dark",
      "other-app": "x",
    });

    clearPortalData(storage);

    expect([...storage.data.keys()].sort()).toEqual(["gamesroomz-prime-theme", "other-app"]);
  });
});
