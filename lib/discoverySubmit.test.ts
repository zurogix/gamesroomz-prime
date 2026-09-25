import { describe, expect, it } from "vitest";
import { DISCOVERY_QUESTIONS, DISCOVERY_SECTIONS } from "./discovery";
import { AnswerMap, canSubmitDiscovery, emptyAnswer, NOT_SURE_ID, unansweredQuestions } from "./discoveryAnswers";
import { DiscoveryQuestion, QuestionAnswer } from "./discoveryTypes";
import { OVERVIEW } from "./sections";
import { PRODUCT_SUBMIT_NOTE, sectionNav } from "./sectionNav";
import { PUBLISH_NEEDS_SUBMISSION, submitResponseRefusal, UNANSWERED_ERROR } from "./responses";
import { transitionRequirementError } from "./stageActions";
import { initialAssessment } from "./assessment";

/** "Not sure" for every question: choices pick Not sure, open questions use "Not sure yet" + what needs checking. */
function notSureAnswer(q: DiscoveryQuestion): QuestionAnswer {
  const answer = emptyAnswer();
  if (q.type === "open") return { ...answer, notSureYet: true, needsChecking: "Check the build scripts" };
  if (q.type === "rows") return { ...answer, rows: Object.fromEntries(q.rows.map((r) => [r.id, { selected: [NOT_SURE_ID], other: "" }])) };
  return { ...answer, choice: { selected: [NOT_SURE_ID], other: "" } };
}

const allAnswered = () => Object.fromEntries(DISCOVERY_QUESTIONS.map((q) => [q.id, notSureAnswer(q)]));

describe("submitting discovery", () => {
  it("is blocked while any question is unanswered", () => {
    expect(canSubmitDiscovery({})).toBe(false);
    const answers = allAnswered();
    delete answers[DISCOVERY_QUESTIONS[5].id];

    expect(canSubmitDiscovery(answers)).toBe(false);
    expect(unansweredQuestions(answers).map((q) => q.id)).toEqual([DISCOVERY_QUESTIONS[5].id]);
  });

  it("does not count 'Not sure yet' without what needs checking", () => {
    const open = DISCOVERY_QUESTIONS.find((q) => q.type === "open")!;
    const answers = { ...allAnswered(), [open.id]: { ...emptyAnswer(), notSureYet: true } };

    expect(canSubmitDiscovery(answers)).toBe(false);
  });

  it("is allowed when every question is answered or Not sure; evidence and basis stay optional", () => {
    expect(canSubmitDiscovery(allAnswered())).toBe(true);
  });

  it("is enforced for the developer's own response on the server", () => {
    const developer = { id: "dev-1", role: "developer" as const };
    const own = (answers: AnswerMap) => ({ profileId: "dev-1", status: "in-progress" as const, answers });

    expect(submitResponseRefusal(developer, own({}), "discovery")).toEqual({ status: 400, error: UNANSWERED_ERROR });
    expect(submitResponseRefusal(developer, own(allAnswered()), "discovery")).toBeNull();
  });
});

describe("publishing findings", () => {
  const publishing = { ...initialAssessment(), status: "findings" as const };

  it("needs at least one developer's submitted discovery", () => {
    expect(transitionRequirementError("discovery", publishing, { submittedResponses: 0 })).toBe(PUBLISH_NEEDS_SUBMISSION);
    expect(transitionRequirementError("discovery", publishing, { submittedResponses: 1 })).toBeNull();
  });

  it("does not affect other transitions", () => {
    expect(transitionRequirementError("findings", { ...publishing, status: "plan" }, { submittedResponses: 0 })).toBeNull();
  });
});

describe("section navigation labels", () => {
  const last = DISCOVERY_SECTIONS.length - 1;

  it("first section goes back to the Overview", () => {
    expect(sectionNav(0).prev).toEqual({ view: OVERVIEW, label: "← Previous: Overview" });
    expect(sectionNav(0).next?.label).toBe(`Next: ${DISCOVERY_SECTIONS[1].title} →`);
  });

  it("middle sections name both neighbours", () => {
    const nav = sectionNav(3);

    expect(nav.prev.label).toBe(`← Previous: ${DISCOVERY_SECTIONS[2].title}`);
    expect(nav.next).toEqual({ view: DISCOVERY_SECTIONS[4].title, label: `Next: ${DISCOVERY_SECTIONS[4].title} →` });
  });

  it("the last section has no next button (submit or the product note goes there)", () => {
    expect(sectionNav(last).prev.label).toBe(`← Previous: ${DISCOVERY_SECTIONS[last - 1].title}`);
    expect(sectionNav(last).next).toBeNull();
    expect(PRODUCT_SUBMIT_NOTE).toBe("The developer submits discovery from here.");
  });
});
