import { describe, expect, it } from "vitest";
import { hydrateAssessment } from "./assessment";
import { nextStepText } from "./nextStep";
import { stageActionsFor } from "./stageActions";
import { hydrateStatus, isPreview, stageById, stageProgress, STAGES, stageVisible, StageId, STATUSES, WHAT_HAPPENS_NEXT } from "./stages";
import { AssessmentStatus } from "./types";

const visibleTo = (role: "developer" | "product", status: AssessmentStatus) =>
  STAGES.filter((s) => stageVisible(role, s, status)).map((s) => s.id);

describe("stage visibility", () => {
  const developer: Record<AssessmentStatus, StageId[]> = {
    discovery: ["discovery"],
    "discovery-submitted": ["discovery"],
    findings: ["discovery", "findings"],
    plan: ["discovery", "findings", "plan"],
    "plan-submitted": ["discovery", "findings", "plan"],
    agreed: ["discovery", "findings", "plan", "summary"],
  };

  it.each(STATUSES.map((s) => s.value))("in %s", (status) => {
    expect(visibleTo("developer", status)).toEqual(developer[status]);
    expect(visibleTo("product", status)).toEqual(["discovery", "findings", "plan", "summary"]);
  });

  it("labels stages product opens early as Preview", () => {
    expect(isPreview("product", stageById("plan"), "findings")).toBe(true);
    expect(isPreview("product", stageById("findings"), "findings")).toBe(false);
    expect(isPreview("developer", stageById("plan"), "findings")).toBe(false);
  });

  it("marks stages done, current and locked", () => {
    expect(STAGES.map((s) => stageProgress(s, "discovery-submitted"))).toEqual(["current", "locked", "locked", "locked"]);
    expect(STAGES.map((s) => stageProgress(s, "plan-submitted"))).toEqual(["done", "done", "current", "locked"]);
    expect(STAGES.map((s) => stageProgress(s, "agreed"))).toEqual(["done", "done", "done", "current"]);
  });
});

describe("old status values", () => {
  it.each(["draft", "assessment-complete", "planning", "submitted", "changes-requested", "approved", undefined, 3])("%s in saved JSON becomes discovery", (old) => {
    expect(hydrateStatus(old)).toBe("discovery");
    expect(hydrateAssessment({ status: old as string }).status).toBe("discovery");
  });

  it("keeps current values", () => {
    STATUSES.forEach(({ value }) => expect(hydrateStatus(value)).toBe(value));
  });
});

describe("stage actions and next step", () => {
  it("offers the buttons for each role and status", () => {
    expect(stageActionsFor("developer", "discovery").map((a) => a.label)).toEqual(["Submit discovery"]);
    expect(stageActionsFor("product", "discovery-submitted").map((a) => a.label)).toEqual(["Publish findings", "Reopen discovery"]);
    expect(stageActionsFor("product", "findings").map((a) => a.label)).toEqual(["Options agreed — open plan"]);
    expect(stageActionsFor("developer", "plan").map((a) => a.label)).toEqual(["Submit plan"]);
    expect(stageActionsFor("product", "plan-submitted").map((a) => a.label)).toEqual(["Agree plan", "Request changes"]);
    expect(stageActionsFor("product", "agreed").map((a) => a.label)).toEqual(["Reopen plan"]);
    expect(stageActionsFor("developer", "findings")).toEqual([]);
  });

  it("describes the next step for every role and status", () => {
    expect(nextStepText("developer", "discovery-submitted")).toBe(WHAT_HAPPENS_NEXT);
    expect(nextStepText("product", "discovery")).toBe("Fill in the Prime targets, then invite the developer from Team.");
    STATUSES.forEach(({ value }) => {
      expect(nextStepText("developer", value)).not.toBe("");
      expect(nextStepText("product", value)).not.toBe("");
    });
  });
});
