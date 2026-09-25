import { describe, expect, it } from "vitest";
import { hydrateAssessment, initialAssessment } from "./assessment";
import { nextStepText } from "./nextStep";
import { FINDINGS, OVERVIEW, PLAN, SUMMARY } from "./sections";
import { applyStatusChange, stageActionsFor, withTransitionEffects } from "./stageActions";
import { hydrateStatus, isPreview, navigableStages, stageById, stageProgress, STAGES, StageId, STATUSES, viewOpen, WHAT_HAPPENS_NEXT } from "./stages";
import { AssessmentStatus } from "./types";

const ids = (role: "developer" | "product", status: AssessmentStatus, preview = false) => navigableStages(role, status, preview).map((s) => s.id);

const OPEN: Record<AssessmentStatus, StageId[]> = {
  discovery: ["discovery"],
  "discovery-submitted": ["discovery"],
  findings: ["discovery", "findings"],
  plan: ["discovery", "findings", "plan"],
  "plan-submitted": ["discovery", "findings", "plan"],
  agreed: ["discovery", "findings", "plan", "summary"],
};

describe("stage navigation", () => {
  it.each(STATUSES.map((s) => s.value))("a developer only ever gets open stages in %s", (status) => {
    expect(ids("developer", status)).toEqual(OPEN[status]);
    // The preview switch has no effect for developers.
    expect(ids("developer", status, true)).toEqual(OPEN[status]);
  });

  it.each(STATUSES.map((s) => s.value))("product sees the same by default, and every stage with preview on (%s)", (status) => {
    expect(ids("product", status)).toEqual(OPEN[status]);
    expect(ids("product", status, true)).toEqual(["discovery", "findings", "plan", "summary"]);
  });

  it("blocks views of unopened stages", () => {
    expect(viewOpen(PLAN, "developer", "findings")).toBe(false);
    expect(viewOpen(SUMMARY, "developer", "plan-submitted")).toBe(false);
    expect(viewOpen(FINDINGS, "developer", "findings")).toBe(true);
    expect(viewOpen(OVERVIEW, "developer", "discovery")).toBe(true);
    expect(viewOpen(PLAN, "product", "findings")).toBe(false);
    expect(viewOpen(PLAN, "product", "findings", true)).toBe(true);
  });

  it("labels only previewed upcoming stages as Preview", () => {
    expect(isPreview("product", stageById("plan"), "findings", true)).toBe(true);
    expect(isPreview("product", stageById("plan"), "findings", false)).toBe(false);
    expect(isPreview("product", stageById("findings"), "findings", true)).toBe(false);
    expect(isPreview("developer", stageById("plan"), "findings", true)).toBe(false);
  });

  it("marks stages done, current and upcoming", () => {
    expect(STAGES.map((s) => stageProgress(s, "discovery-submitted"))).toEqual(["current", "upcoming", "upcoming", "upcoming"]);
    expect(STAGES.map((s) => stageProgress(s, "plan-submitted"))).toEqual(["done", "done", "current", "upcoming"]);
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

describe("confirmation ticks", () => {
  const ticked = (status: AssessmentStatus) => ({ ...initialAssessment(), status, checks: initialAssessment().checks.map(() => true) });

  it("are cleared by Request changes and Reopen plan", () => {
    expect(applyStatusChange(ticked("plan-submitted"), "plan").checks.every((c) => !c)).toBe(true);
    expect(applyStatusChange(ticked("agreed"), "plan").checks.every((c) => !c)).toBe(true);
    expect(withTransitionEffects("plan-submitted", { ...ticked("plan-submitted"), status: "plan" }).checks.some(Boolean)).toBe(false);
  });

  it("are kept for other status changes", () => {
    expect(applyStatusChange(ticked("plan"), "plan-submitted").checks.every(Boolean)).toBe(true);
    expect(applyStatusChange(ticked("plan-submitted"), "agreed").checks.every(Boolean)).toBe(true);
    expect(applyStatusChange(ticked("plan-submitted"), "plan").status).toBe("plan");
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
    expect(nextStepText("product", "discovery")).toBe("Invite the developer from Team, then share the portal link.");
    STATUSES.forEach(({ value }) => {
      expect(nextStepText("developer", value)).not.toBe("");
      expect(nextStepText("product", value)).not.toBe("");
    });
  });
});
