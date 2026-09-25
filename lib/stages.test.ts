import { describe, expect, it } from "vitest";
import { hydrateAssessment, initialAssessment } from "./assessment";
import { nextStepText } from "./nextStep";
import { FINDINGS, OVERVIEW, PLAN, SUMMARY } from "./sections";
import { applyStatusChange, stageActionsFor, withTransitionEffects } from "./stageActions";
import type { Role } from "./permissions";
import { hydrateStatus, navigableStages, stageProgress, STAGES, StageId, stageSummary, STATUSES, viewOpen, WHAT_HAPPENS_NEXT } from "./stages";
import { AssessmentStatus } from "./types";

const ids = (status: AssessmentStatus) => navigableStages(status).map((s) => s.id);

const OPEN: Record<AssessmentStatus, StageId[]> = {
  discovery: ["discovery"],
  findings: ["discovery", "findings"],
  plan: ["discovery", "findings", "plan"],
  "plan-submitted": ["discovery", "findings", "plan"],
  agreed: ["discovery", "findings", "plan", "summary"],
};

const ROLES: Role[] = ["developer", "product"];

describe("stage navigation", () => {
  it.each(STATUSES.map((s) => s.value))("depends only on the status, the same for both roles (%s)", (status) => {
    // Visibility takes no role at all, so product and developer always get the same stages.
    expect(navigableStages.length).toBe(1);
    expect(viewOpen.length).toBe(2);
    expect(ids(status)).toEqual(OPEN[status]);
  });

  it("blocks views of stages not reached yet", () => {
    expect(viewOpen(PLAN, "findings")).toBe(false);
    expect(viewOpen(SUMMARY, "plan-submitted")).toBe(false);
    expect(viewOpen(FINDINGS, "discovery")).toBe(false);
    expect(viewOpen(FINDINGS, "findings")).toBe(true);
    expect(viewOpen(OVERVIEW, "discovery")).toBe(true);
  });

  it("opens stages only through Publish findings, Options agreed — open plan and Agree plan", () => {
    const opening = ROLES.flatMap((role) =>
      STATUSES.flatMap(({ value: from }) =>
        stageActionsFor(role, from)
          .filter((a) => ids(a.to).length > ids(from).length)
          .map((a) => `${a.label} → ${ids(a.to).at(-1)}`),
      ),
    );

    expect(opening.sort()).toEqual(["Agree plan → summary", "Options agreed — open plan → plan", "Publish findings → findings"]);
  });

  it("summarises the current step and status for the rail", () => {
    expect(stageSummary("discovery")).toBe("Step 1: Discovery — Discovery in progress");
    expect(stageSummary("findings")).toBe("Step 2: Findings & options — Findings & options, open for comments");
    expect(stageSummary("agreed")).toBe("Step 4: Summary — Plan agreed");
  });

  it("marks stages done, current and upcoming", () => {
    expect(STAGES.map((s) => stageProgress(s, "discovery"))).toEqual(["current", "upcoming", "upcoming", "upcoming"]);
    expect(STAGES.map((s) => stageProgress(s, "plan-submitted"))).toEqual(["done", "done", "current", "upcoming"]);
    expect(STAGES.map((s) => stageProgress(s, "agreed"))).toEqual(["done", "done", "done", "current"]);
  });
});

describe("old status values", () => {
  it.each(["discovery-submitted", "draft", "assessment-complete", "planning", "submitted", "changes-requested", "approved", undefined, 3])("%s in saved JSON becomes discovery", (old) => {
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
    // Developers submit their own discovery response; it is not a game status change.
    expect(stageActionsFor("developer", "discovery")).toEqual([]);
    expect(stageActionsFor("product", "discovery").map((a) => a.label)).toEqual(["Publish findings"]);
    expect(stageActionsFor("product", "findings").map((a) => a.label)).toEqual(["Options agreed — open plan"]);
    expect(stageActionsFor("developer", "plan").map((a) => a.label)).toEqual(["Submit plan"]);
    expect(stageActionsFor("product", "plan-submitted").map((a) => a.label)).toEqual(["Agree plan", "Request changes"]);
    expect(stageActionsFor("product", "agreed").map((a) => a.label)).toEqual(["Reopen plan"]);
    expect(stageActionsFor("developer", "findings")).toEqual([]);
  });

  it("describes the next step for every role and status", () => {
    expect(nextStepText("developer", "discovery", "submitted")).toBe(WHAT_HAPPENS_NEXT);
    expect(nextStepText("developer", "discovery", "in-progress")).toMatch(/^Start with section A/);
    expect(nextStepText("product", "discovery")).toMatch(/Publish findings once at least one developer has submitted/);
    STATUSES.forEach(({ value }) => {
      expect(nextStepText("developer", value)).not.toBe("");
      expect(nextStepText("product", value)).not.toBe("");
    });
  });
});
